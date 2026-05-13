import { LOYALTY_POINTS_RATIO } from '../constants/constants';
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
