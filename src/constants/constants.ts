import path from 'path';
//PATH
const DATA_DIR = path.join(__dirname, '../legacy/data');

export const DATA_PATHS = {
  CUSTOMERS: path.join(DATA_DIR, 'customers.csv'),
  PRODUCTS: path.join(DATA_DIR, 'products.csv'),
  ORDERS: path.join(DATA_DIR, 'orders.csv'),
  PROMOTIONS: path.join(DATA_DIR, 'promotions.csv'),
  SHIPPING_ZONES: path.join(DATA_DIR, 'shipping_zones.csv'),
} as const;
//TAXES
export const TAX_RATE = 0.2;

//REMISES
export const MAX_TOTAL_DISCOUNT = 200;
export const PREMIUM_DISCOUNT_TRESHOLD = 1000;
export const MORNING_BONUS_RATE = 0.03;
export const MORNING_BONUS_HOUR = 10;
export const WEEKEND_BONUS_MULTIPLIER = 1.05;

export const DISCOUNT_TIERS = [
  { threshold: 1000, rate: 0.2, requiresPremium: true },
  { threshold: 500, rate: 0.15 },
  { threshold: 100, rate: 0.1 },
  { threshold: 50, rate: 0.05 },
] as const;

//FIDELITE
export const LOYALTY_POINTS_RATIO = 0.01;
export const LOYALTY_TIER_1_TRESHOLD = 100;
export const LOYALTY_TIER_1_RATE = 0.1;
export const LOYALTY_TIER_1_MAX = 50.0;
export const LOYALTY_TIER_2_TRESHOLD = 500;
export const LOYALTY_TIER_2_MAX = 100.0;
export const LOYALTY_TIER_2_RATE = 0.15;

//LIVRAISON
export const FREE_SHIPPING_TRESHOLD = 50;
export const DEFAULT_SHIPPING_FEE = 5.0;
export const HANDLING_FEE_AMOUNT = 2.5;
export const HANDLING_FEE_LARGE_ORDER = 5.0;
export const HANDLING_TRESHOLD_1 = 10;
export const HANDLING_TRESHOLD_2 = 20;

//Devises
export const CURRENCY_RATES: Record<string, number> = {
  EUR: 1.0,
  USD: 1.1,
  GBP: 0.85,
};
