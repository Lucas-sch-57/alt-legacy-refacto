import {
  CURRENCY_RATES,
  DEFAULT_PER_KG_RATE,
  DEFAULT_SHIPPING_FEE,
  DISCOUNT_TIERS,
  FREE_SHIPPING_HEAVY_RATE,
  FREE_SHIPPING_HEAVY_THRESHOLD,
  FREE_SHIPPING_TRESHOLD,
  HANDLING_FEE_AMOUNT,
  HANDLING_FEE_LARGE_ORDER,
  HANDLING_TRESHOLD_1,
  HANDLING_TRESHOLD_2,
  HEAVY_WEIGHT_THRESHOLD,
  LOYALTY_POINTS_RATIO,
  LOYALTY_TIER_1_MAX,
  LOYALTY_TIER_1_RATE,
  LOYALTY_TIER_1_TRESHOLD,
  LOYALTY_TIER_2_MAX,
  LOYALTY_TIER_2_RATE,
  LOYALTY_TIER_2_TRESHOLD,
  MEDIUM_WEIGHT_RATE,
  MEDIUM_WEIGHT_THRESHOLD,
  MORNING_BONUS_HOUR,
  MORNING_BONUS_RATE,
  REMOTE_ZONE_MULTIPLIER,
  REMOTE_ZONES,
  TAX_RATE,
  WEEKEND_BONUS_MULTIPLIER,
} from '../constants/constants';
import { Customer, CustomerTotal } from '../types/customer';
import { Order } from '../types/order';
import { Product } from '../types/product';
import { Promotion } from '../types/promotion';
import { ShippingZone } from '../types/shipping-zone';
import { loadShippingZones } from './data-loader';

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
export const calculateLineTotal = (
  order: Order,
  basePrice: number,
  promotions: Record<string, Promotion>,
): { lineTotal: number; morningBonus: number } => {
  const promoCode = order.promo_code;
  let discountRate = 0;
  let fixedDiscount = 0;
  if (promoCode && promotions[promoCode]) {
    const promo = promotions[promoCode];
    if (promo.active) {
      if (promo.type === 'PERCENTAGE') {
        discountRate = promo.value / 100;
      } else if (promo.type === 'FIXED') {
        fixedDiscount = promo.value;
      }
    }
  }
  let lineTotal = order.qty * basePrice * (1 - discountRate) - fixedDiscount * order.qty;

  //Bonus Matin
  const hour = Number(order.time.split(':')[0]);
  let morningBonus = 0;
  if (hour < MORNING_BONUS_HOUR) {
    morningBonus = lineTotal * MORNING_BONUS_RATE;
  }
  lineTotal = lineTotal - morningBonus;

  return {
    lineTotal,
    morningBonus,
  };
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
    if (product && product.taxable !== false) {
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

// ---- Shipping ---- //
export const calculateShipping = (
  customerTotal: CustomerTotal,
  customer: Customer,
  shippingZones: Record<string, ShippingZone>,
): number => {
  let ship = 0.0;
  const weight = customerTotal.weight;
  const subTotal = customerTotal.subtotal;
  const zone = customer.shipping_zone;

  if (subTotal < FREE_SHIPPING_TRESHOLD) {
    const shipZone = shippingZones[zone] || {
      base: DEFAULT_SHIPPING_FEE,
      per_kg: DEFAULT_PER_KG_RATE,
    };

    const baseShip = shipZone.base;

    if (weight > HEAVY_WEIGHT_THRESHOLD) {
      ship = baseShip + (weight - HEAVY_WEIGHT_THRESHOLD) * shipZone.per_kg;
    } else if (weight > MEDIUM_WEIGHT_THRESHOLD) {
      ship = baseShip + (weight - MEDIUM_WEIGHT_THRESHOLD) * MEDIUM_WEIGHT_RATE;
    } else {
      ship = shipZone.base;
    }

    //Majoration pour livraison en zone éloignée
    if (REMOTE_ZONES.includes(zone)) {
      ship = ship * REMOTE_ZONE_MULTIPLIER;
    }
  } else {
    if (weight > FREE_SHIPPING_HEAVY_THRESHOLD) {
      ship = (weight - FREE_SHIPPING_HEAVY_THRESHOLD) * FREE_SHIPPING_HEAVY_RATE;
    }
  }
  return ship;
};

export const calculateHandlingFee = (customerTotal: CustomerTotal): Number => {
  let handling = 0.0;
  const itemCount = customerTotal.items.length;
  if (itemCount > HANDLING_TRESHOLD_1) {
    handling = HANDLING_FEE_AMOUNT;
  }
  if (itemCount > HANDLING_TRESHOLD_2) {
    handling = HANDLING_FEE_LARGE_ORDER;
  }

  return handling;
};
