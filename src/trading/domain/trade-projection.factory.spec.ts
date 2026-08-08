import {
  buildBuyerProjection,
  buildSellerProjection,
  TradeProjection,
} from './trade-projection.factory';
import { TradeState } from '../enums/trade-state.enum';

describe('trade-projection.factory', () => {
  const baseTrade = {
    id: 'trade-1',
    watchId: 'watch-1',
    state: TradeState.ESCROW_FUNDED,
    grossAmount: '10000.00',
    commissionAmount: '700.00',
    netPayout: '9300.00',
    escrowDeadline: new Date('2026-08-10T00:00:00.000Z'),
    shipmentSlaDeadline: new Date('2026-08-11T00:00:00.000Z'),
    disputeWindowEnds: null,
    trackingNumber: 'DHL-1',
    disputeReason: null,
    createdAt: new Date('2026-08-08T00:00:00.000Z'),
  };

  it('buyer projection includes funded amount and hides seller payout fields', () => {
    const projection = buildBuyerProjection(baseTrade as never);

    expect(projection.fundedAmount).toBe('10000.00');
    expect(projection.disputeWindowEnds).toBeNull();
    expect(projection).not.toHaveProperty('netPayout');
    expect(projection).not.toHaveProperty('commissionAmount');
  });

  it('seller projection includes payout fields and hides buyer dispute deadline', () => {
    const projection = buildSellerProjection(baseTrade as never);

    expect(projection.netPayout).toBe('9300.00');
    expect(projection.commissionAmount).toBe('700.00');
    expect(projection.shipmentSlaDeadline).toBe('2026-08-11T00:00:00.000Z');
    expect(projection).not.toHaveProperty('disputeWindowEnds');
    expect(projection).not.toHaveProperty('fundedAmount');
  });
});
