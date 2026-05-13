import {
  DISCOUNT_TIERS,
  LOYALTY_POINTS_RATIO,
  WEEKEND_BONUS_MULTIPLIER,
} from '../constants/constants';
import { Customer, CustomerTotal } from '../types/customer';
import { Order } from '../types/order';

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
