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
/**
 * Calculates loyalty points accumulated per customer.
 * Each point equals 1% of the total order amount.
 * @param orders - List of all orders
 * @returns Map of customer_id → loyalty points
 */
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
/**
 * Calculates the loyalty discount based on accumulated points.
 * Tier 1: > 100 pts → 10% of points, capped at 50€
 * Tier 2: > 500 pts → 15% of points, capped at 100€ (overwrites tier 1)
 * @param points - Customer loyalty points
 * @returns Loyalty discount amount in euros
 */
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

/**
 * Calculates the volume discount based on subtotal tiers.
 * NOTE: Tiers overwrite each other (intentional legacy behavior preserved) :
 * - > 50€   → 5%
 * - > 100€  → 10%
 * - > 500€  → 15%
 * - > 1000€ → 20% (PREMIUM customers only)
 * A 5% bonus is applied on the discount if the first order was placed on a weekend.
 * @param customerTotal - Aggregated customer order data
 * @param customer - Customer data including level and shipping zone
 * @returns Volume discount amount in euros
 */
export const calculateVolumeDiscount = (
  customerTotal: CustomerTotal,
  customer: Customer,
): number => {
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
  if (subTotal > 1000 && customer.level === 'PREMIUM') {
    disc = subTotal * DISCOUNT_TIERS[0].rate;
  }

  const firstOrderDate = customerTotal.items[0]?.date || '';
  const dayOfWeek = firstOrderDate ? new Date(firstOrderDate).getDay() : 0;
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    disc = disc * WEEKEND_BONUS_MULTIPLIER;
  }
  return disc;
};
/**
 * Calculates the total amount for a single order line.
 * Applies promo code (percentage or fixed) and morning bonus (-3% before 10am).
 * NOTE: Fixed discount is multiplied by quantity (intentional legacy behavior preserved).
 * @param order - The order line
 * @param basePrice - Base unit price (from product catalog or order fallback)
 * @param promotions - Map of available promotions
 * @returns Object containing the line total and morning bonus amount
 */
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
/**
 * Checks if all products in an order are taxable.
 * A product is considered taxable unless explicitly set to false.
 * @param orders - Customer order lines
 * @param products - Product catalog
 * @returns True if all products are taxable, false otherwise
 */
const areAllProductsTaxable = (orders: Order[], products: Record<string, Product>): boolean => {
  return orders.every((item) => products[item.product_id]?.taxable !== false);
};
/**
 * Calculates tax on the full taxable amount (when all products are taxable).
 * @param taxableAmount - Subtotal after discounts
 * @returns Tax amount rounded to 2 decimal places
 */
const calculateGlobalTax = (taxableAmount: number) => {
  return Math.round(taxableAmount * TAX_RATE * 100) / 100;
};

/**
 * Calculates tax line by line for orders containing non-taxable products.
 * Only taxable products contribute to the tax amount.
 * @param orders - Customer order lines
 * @param products - Product catalog
 * @returns Tax amount rounded to 2 decimal places
 */
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
/**
 * Converts a tax amount to the customer's currency.
 * @param tax - Tax amount in euros
 * @param currency - Target currency code (EUR, USD, GBP)
 * @returns Converted tax amount
 */
export const convertTax = (tax: number, currency: string): number => {
  const currencyRate = CURRENCY_RATES[currency] ?? CURRENCY_RATES['EUR'];
  return tax * currencyRate;
};
/**
 * Calculates the tax amount for a customer's orders.
 * If all products are taxable, applies a global 20% tax on the taxable amount.
 * Otherwise, calculates tax line by line for taxable products only.
 * @param taxableAmount - Subtotal after discounts
 * @param orders - Customer order lines
 * @param products - Product catalog
 * @returns Tax amount rounded to 2 decimal places
 */
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

/**
 * Calculates shipping costs based on subtotal, weight and shipping zone.
 * Free shipping above FREE_SHIPPING_THRESHOLD, except handling fees for heavy orders.
 * Remote zones (ZONE3, ZONE4) incur a 20% surcharge.
 * @param customerTotal - Aggregated customer order data including weight
 * @param customer - Customer data including shipping zone
 * @param shippingZones - Map of available shipping zones with rates
 * @returns Shipping cost in euros
 */
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
/**
 * Calculates handling fees based on the number of items ordered.
 * - > 10 items → 2.50€
 * - > 20 items → 5.00€
 * @param customerTotal - Aggregated customer order data
 * @returns Handling fee amount in euros
 */
export const calculateHandlingFee = (customerTotal: CustomerTotal): number => {
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

// --- Total --- //

/**
 * Calculates the final order total including tax, shipping and handling.
 * Applies currency conversion rate for non-EUR customers.
 * @param taxable - Subtotal after discounts
 * @param tax - Tax amount
 * @param ship - Shipping cost
 * @param handling - Handling fee
 * @param currency - Customer currency code (EUR, USD, GBP)
 * @returns Final total rounded to 2 decimal places
 */
export const calculateTotal = (
  taxable: number,
  tax: number,
  ship: number,
  handling: number,
  currency: string,
): number => {
  const currencyRate = CURRENCY_RATES[currency] ?? CURRENCY_RATES['EUR'];
  return Math.round((taxable + tax + ship + handling) * currencyRate * 100) / 100;
};
