import { TradeAction } from '../enums/trade-action.enum';
import { TradeState } from '../enums/trade-state.enum';
import { Trade } from '../entities/trade.entity';
import {
  applyTransition,
  canTransition,
  getNextState,
  isTerminalState,
} from './trade-state-machine';
import { TradeTransitionError } from './trade-transition.error';

function createTrade(state: TradeState): Trade {
  const trade = new Trade();
  trade.state = state;
  trade.grossAmount = '10000.00';
  trade.commissionAmount = '700.00';
  trade.netPayout = '9300.00';
  trade.escrowDeadline = null;
  trade.shipmentSlaDeadline = null;
  trade.disputeWindowEnds = null;
  return trade;
}

describe('trade state machine', () => {
  it('allows the happy path transitions', () => {
    const path: Array<[TradeState, TradeAction, TradeState]> = [
      [TradeState.DRAFT, TradeAction.SUBMIT_FOR_AUTH, TradeState.PENDING_AUTH],
      [TradeState.PENDING_AUTH, TradeAction.AUTH_PASS, TradeState.AUTH_PASSED],
      [TradeState.AUTH_PASSED, TradeAction.FUND_ESCROW, TradeState.ESCROW_FUNDED],
      [TradeState.ESCROW_FUNDED, TradeAction.MARK_SHIPPED, TradeState.SHIPPED],
      [TradeState.SHIPPED, TradeAction.MARK_DELIVERED, TradeState.DELIVERED],
      [TradeState.DELIVERED, TradeAction.RELEASE, TradeState.RELEASED],
    ];

    for (const [from, action, expected] of path) {
      expect(canTransition(from, action)).toBe(true);
      expect(getNextState(from, action)).toBe(expected);
    }
  });

  it('rejects illegal transitions', () => {
    expect(canTransition(TradeState.DRAFT, TradeAction.RELEASE)).toBe(false);
    expect(() => getNextState(TradeState.DRAFT, TradeAction.RELEASE)).toThrow(
      TradeTransitionError,
    );
  });

  it('marks terminal states correctly', () => {
    expect(isTerminalState(TradeState.RELEASED)).toBe(true);
    expect(isTerminalState(TradeState.DRAFT)).toBe(false);
  });

  it('sets deadlines when entering key states', () => {
    const trade = createTrade(TradeState.PENDING_AUTH);
    applyTransition(trade, TradeAction.AUTH_PASS);
    expect(trade.state).toBe(TradeState.AUTH_PASSED);
    expect(trade.escrowDeadline).not.toBeNull();

    applyTransition(trade, TradeAction.FUND_ESCROW);
    expect(trade.shipmentSlaDeadline).not.toBeNull();

    applyTransition(trade, TradeAction.MARK_SHIPPED);
    applyTransition(trade, TradeAction.MARK_DELIVERED);
    expect(trade.disputeWindowEnds).not.toBeNull();
  });
});
