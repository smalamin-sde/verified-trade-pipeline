import {
  DISPUTE_WINDOW_HOURS,
  ESCROW_FUNDING_DEADLINE_HOURS,
  SHIPMENT_SLA_HOURS,
} from '../constants/commission.constant';
import { TradeAction } from '../enums/trade-action.enum';
import { TradeState } from '../enums/trade-state.enum';
import { Trade } from '../entities/trade.entity';
import { TradeTransitionError } from './trade-transition.error';

const TERMINAL_STATES = new Set<TradeState>([
  TradeState.AUTH_FAILED,
  TradeState.RELEASED,
  TradeState.REFUNDED_PRE_SHIP,
  TradeState.REFUNDED_POST_DELIVERY,
  TradeState.EXPIRED,
  TradeState.CANCELLED,
  TradeState.LOST_IN_TRANSIT,
]);

const TRANSITIONS: Record<TradeState, Partial<Record<TradeAction, TradeState>>> = {
  [TradeState.DRAFT]: {
    [TradeAction.SUBMIT_FOR_AUTH]: TradeState.PENDING_AUTH,
    [TradeAction.CANCEL]: TradeState.CANCELLED,
  },
  [TradeState.PENDING_AUTH]: {
    [TradeAction.AUTH_PASS]: TradeState.AUTH_PASSED,
    [TradeAction.AUTH_FAIL]: TradeState.AUTH_FAILED,
    [TradeAction.CANCEL]: TradeState.CANCELLED,
  },
  [TradeState.AUTH_PASSED]: {
    [TradeAction.FUND_ESCROW]: TradeState.ESCROW_FUNDED,
    [TradeAction.EXPIRE]: TradeState.EXPIRED,
  },
  [TradeState.ESCROW_FUNDED]: {
    [TradeAction.MARK_SHIPPED]: TradeState.SHIPPED,
    [TradeAction.REFUND_PRE_SHIP]: TradeState.REFUNDED_PRE_SHIP,
  },
  [TradeState.SHIPPED]: {
    [TradeAction.MARK_DELIVERED]: TradeState.DELIVERED,
    [TradeAction.LOST_IN_TRANSIT]: TradeState.LOST_IN_TRANSIT,
  },
  [TradeState.DELIVERED]: {
    [TradeAction.RELEASE]: TradeState.RELEASED,
    [TradeAction.DISPUTE]: TradeState.DISPUTED,
  },
  [TradeState.DISPUTED]: {
    [TradeAction.RELEASE]: TradeState.RELEASED,
    [TradeAction.REFUND_POST_DELIVERY]: TradeState.REFUNDED_POST_DELIVERY,
  },
  [TradeState.AUTH_FAILED]: {},
  [TradeState.RELEASED]: {},
  [TradeState.REFUNDED_PRE_SHIP]: {},
  [TradeState.REFUNDED_POST_DELIVERY]: {},
  [TradeState.EXPIRED]: {},
  [TradeState.CANCELLED]: {},
  [TradeState.LOST_IN_TRANSIT]: {},
};

export function isTerminalState(state: TradeState): boolean {
  return TERMINAL_STATES.has(state);
}

export function canTransition(
  fromState: TradeState,
  action: TradeAction,
): boolean {
  return TRANSITIONS[fromState][action] !== undefined;
}

export function getNextState(
  fromState: TradeState,
  action: TradeAction,
): TradeState {
  const nextState = TRANSITIONS[fromState][action];

  if (!nextState) {
    throw new TradeTransitionError(fromState, action);
  }

  return nextState;
}

export function applyTransition(trade: Trade, action: TradeAction): Trade {
  const nextState = getNextState(trade.state, action);
  trade.state = nextState;

  const now = new Date();

  if (nextState === TradeState.AUTH_PASSED) {
    trade.escrowDeadline = addHours(now, ESCROW_FUNDING_DEADLINE_HOURS);
  }

  if (nextState === TradeState.ESCROW_FUNDED) {
    trade.shipmentSlaDeadline = addHours(now, SHIPMENT_SLA_HOURS);
  }

  if (nextState === TradeState.DELIVERED) {
    trade.disputeWindowEnds = addHours(now, DISPUTE_WINDOW_HOURS);
  }

  return trade;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export const TERMINAL_TRADE_STATES: TradeState[] = [
  TradeState.AUTH_FAILED,
  TradeState.RELEASED,
  TradeState.REFUNDED_PRE_SHIP,
  TradeState.REFUNDED_POST_DELIVERY,
  TradeState.EXPIRED,
  TradeState.CANCELLED,
  TradeState.LOST_IN_TRANSIT,
];

export function isActiveTradeState(state: TradeState): boolean {
  return !isTerminalState(state);
}
