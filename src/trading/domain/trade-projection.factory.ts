import { Trade } from '../entities/trade.entity';

export interface BuyerTradeProjection {
  id: string;
  watchId: string;
  state: string;
  fundedAmount: string | null;
  escrowDeadline: string | null;
  disputeWindowEnds: string | null;
  trackingNumber: string | null;
  disputeReason: string | null;
  createdAt: string;
}

export interface SellerTradeProjection {
  id: string;
  watchId: string;
  state: string;
  grossAmount: string;
  commissionAmount: string;
  netPayout: string;
  shipmentSlaDeadline: string | null;
  trackingNumber: string | null;
  createdAt: string;
}

export type TradeProjection = BuyerTradeProjection | SellerTradeProjection;

export function buildBuyerProjection(trade: Trade): BuyerTradeProjection {
  return {
    id: trade.id,
    watchId: trade.watchId,
    state: trade.state,
    fundedAmount: isFundedState(trade.state) ? trade.grossAmount : null,
    escrowDeadline: trade.escrowDeadline?.toISOString() ?? null,
    disputeWindowEnds: trade.disputeWindowEnds?.toISOString() ?? null,
    trackingNumber: trade.trackingNumber,
    disputeReason: trade.disputeReason,
    createdAt: trade.createdAt.toISOString(),
  };
}

export function buildSellerProjection(trade: Trade): SellerTradeProjection {
  return {
    id: trade.id,
    watchId: trade.watchId,
    state: trade.state,
    grossAmount: trade.grossAmount,
    commissionAmount: trade.commissionAmount,
    netPayout: trade.netPayout,
    shipmentSlaDeadline: trade.shipmentSlaDeadline?.toISOString() ?? null,
    trackingNumber: trade.trackingNumber,
    createdAt: trade.createdAt.toISOString(),
  };
}

function isFundedState(state: string): boolean {
  return ![
    'DRAFT',
    'PENDING_AUTH',
    'AUTH_PASSED',
    'AUTH_FAILED',
    'CANCELLED',
    'EXPIRED',
  ].includes(state);
}
