import { describe, it, expect } from 'vitest';
import { calculateHandlingFee, calculateVolumeDiscount } from '../services/calculators';
import { Customer } from '../types/customer';
import { DISCOUNT_TIERS, WEEKEND_BONUS_MULTIPLIER } from '../constants/constants';

const makeCustomerTotal = (itemCount: number, subtotal: number) => ({
  subtotal: subtotal,
  weight: 0,
  promoDiscount: 0,
  morningBonus: 0,
  items: Array(itemCount).fill({ date: '2025-01-15' }),
});

const makeCustomer = (): Customer => {
  return {
    id: '001',
    name: 'TEST',
    level: 'BASIC',
    shipping_zone: 'ZONE1',
    currency: 'EUR',
  };
};
describe('calculateHandlingFee', () => {
  it('should return 0 when item count is below first threshold', () => {
    expect(calculateHandlingFee(makeCustomerTotal(5, 0))).toBe(0);
  });

  it('should return 0 at exactly the first threshold (10 items)', () => {
    expect(calculateHandlingFee(makeCustomerTotal(10, 0))).toBe(0);
  });

  it('should return HANDLING_FEE when item count exceeds first threshold', () => {
    expect(calculateHandlingFee(makeCustomerTotal(11, 0))).toBe(2.5);
  });

  it('should return double HANDLING_FEE when item count exceeds second threshold', () => {
    expect(calculateHandlingFee(makeCustomerTotal(21, 0))).toBe(5);
  });
});

describe('calculateVolumeDiscount', () => {
  const customer = makeCustomer();
  const premiumCustomer = { ...makeCustomer(), level: 'PREMIUM' as const };

  it('should return 0 when subtotal is below 50', () => {
    expect(calculateVolumeDiscount(makeCustomerTotal(1, 30), customer)).toBe(0);
  });

  it('should return 5% when subtotal exceeds 50', () => {
    expect(calculateVolumeDiscount(makeCustomerTotal(1, 60), customer)).toBe(3); // 60 * 0.05
  });

  it('should return 10% when subtotal exceeds 100 (overwrites 5%)', () => {
    expect(calculateVolumeDiscount(makeCustomerTotal(1, 150), customer)).toBe(15); // 150 * 0.10
  });

  it('should return 15% when subtotal exceeds 500', () => {
    expect(calculateVolumeDiscount(makeCustomerTotal(1, 600), customer)).toBe(90); // 600 * 0.15
  });

  it('should return 15% when subtotal exceeds 1000 and customer is BASIC', () => {
    expect(calculateVolumeDiscount(makeCustomerTotal(1, 1100), customer)).toBe(165); // 1100 * 0.15
  });

  it('should return 20% when subtotal exceeds 1000 and customer is PREMIUM', () => {
    expect(calculateVolumeDiscount(makeCustomerTotal(1, 1100), premiumCustomer)).toBe(220); // 1100 * 0.20
  });
  // Intentional BUG
  it('should apply 5% weekend bonus on discount when first order is on sunday', () => {
    const weekendTotal = { ...makeCustomerTotal(1, 60), items: [{ date: '2025-01-12' }] }; // dimanche
    expect(calculateVolumeDiscount(weekendTotal, customer)).toBe(3 * WEEKEND_BONUS_MULTIPLIER);
  });

  it('should apply 5% weekend bonus on discount when first order is on saturday', () => {
    const weekendTotal = { ...makeCustomerTotal(1, 60), items: [{ date: '2025-01-11' }] }; // samedi
    expect(calculateVolumeDiscount(weekendTotal, customer)).toBe(3 * WEEKEND_BONUS_MULTIPLIER);
  });
});
