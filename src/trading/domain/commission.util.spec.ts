import { COMMISSION_RATE } from '../constants/commission.constant';
import { calculateCommission } from './commission.util';

describe('calculateCommission', () => {
  it('applies 7% commission and net payout of 93%', () => {
    const result = calculateCommission(10000);

    expect(COMMISSION_RATE).toBe(0.07);
    expect(result.grossAmount).toBe('10000.00');
    expect(result.commissionAmount).toBe('700.00');
    expect(result.netPayout).toBe('9300.00');
  });
});
