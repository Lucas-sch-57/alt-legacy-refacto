import {
  DISCOUNT_TIERS,
  LOYALTY_POINTS_RATIO,
  LOYALTY_TIER_1_MAX,
  LOYALTY_TIER_1_RATE,
  LOYALTY_TIER_1_TRESHOLD,
  LOYALTY_TIER_2_MAX,
  LOYALTY_TIER_2_RATE,
  LOYALTY_TIER_2_TRESHOLD,
  TAX_RATE,
  WEEKEND_BONUS_MULTIPLIER,
} from '../constants/constants';
import { Customer, CustomerTotal } from '../types/customer';
import { Order } from '../types/order';
import { Product } from '../types/product';

// ---- Loyalty ---- //
export const calculateLoyaltyPoints = (orders: Order[]): Record<string, number> => {
  const loyaltyPoints: Record<string, number> = {};

  for (const order of orders) {
    const customerId = order.customer_id;
    if (!loyaltyPoints[customerId]) {
      loyaltyPoints[customerId] = 0;
    }
    loyaltyPoints[customerId] += order.qty * order.unit_price * LOYALTY_POINTS_RATIO;
  }

  return loyaltyPoints;
};

export const calculateLoyaltyDiscount = (points: number) => {
  let loyaltyDiscount = 0.0;
  if (points > LOYALTY_TIER_1_TRESHOLD) {
    loyaltyDiscount = Math.min(points * LOYALTY_TIER_1_RATE, LOYALTY_TIER_1_MAX);
  }
  if (points > LOYALTY_TIER_2_TRESHOLD) {
    loyaltyDiscount = Math.min(points * LOYALTY_TIER_2_RATE, LOYALTY_TIER_2_MAX);
  }

  return loyaltyDiscount;
};
// ---- Discounts ---- //
export const calculateVolumeDiscount = (customerTotal: CustomerTotal): number => {
  let disc = 0.0;
  const subTotal = customerTotal.subtotal;

  if (subTotal > 50) {
    disc = subTotal * DISCOUNT_TIERS[3].rate;
  }
  if (subTotal > 100) {
    disc = subTotal * DISCOUNT_TIERS[2].rate;
  }
  if (subTotal > 500) {
    disc = subTotal * DISCOUNT_TIERS[1].rate;
  }
  if (subTotal > 1000) {
    disc = subTotal * DISCOUNT_TIERS[0].rate;
  }

  const firstOrderDate = customerTotal.items[0]?.date || '';
  const dayOfWeek = firstOrderDate ? new Date(firstOrderDate).getDay() : 0;
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    disc = disc * WEEKEND_BONUS_MULTIPLIER;
  }
  return disc;
};
// ---- Tax ---- //

const areAllProductsTaxable = (orders: Order[], products: Record<string, Product>): boolean => {
  return orders.every((item) => products[item.product_id]?.taxable !== false);
};

const calculateGlobalTax = (taxableAmount: number) => {
  return Math.round(taxableAmount * TAX_RATE * 100) / 100;
};

const calculateMixedTax = (orders: Order[], products: Record<string, Product>): number => {
  let tax = 0;
  for (const item of orders) {
    const product = products[item.product_id];
    if (product && product.taxable) {
      const itemTotal = item.qty * (product.price || item.unit_price);
      tax += itemTotal * TAX_RATE;
    }
  }
  return Math.round(tax * 100) / 100;
};

export const calculateTax = (
  taxableAmount: number,
  orders: Order[],
  products: Record<string, Product>,
) => {
  if (areAllProductsTaxable(orders, products)) {
    return calculateGlobalTax(taxableAmount);
  }
  return calculateMixedTax(orders, products);
};
