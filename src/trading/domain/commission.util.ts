import { COMMISSION_RATE } from '../constants/commission.constant';

export interface CommissionBreakdown {
  grossAmount: string;
  commissionAmount: string;
  netPayout: string;
}

export function calculateCommission(gross: number): CommissionBreakdown {
  const commissionAmount = roundMoney(gross * COMMISSION_RATE);
  const netPayout = roundMoney(gross - commissionAmount);

  return {
    grossAmount: formatMoney(gross),
    commissionAmount: formatMoney(commissionAmount),
    netPayout: formatMoney(netPayout),
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}
