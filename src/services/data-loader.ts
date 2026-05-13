import { Customer } from '../types/customer';
import { readCsv } from '../utils/csv-utils';
import { DATA_PATHS } from '../constants/constants';
import { Product } from '../types/product';
import { Order } from '../types/order';
import { ShippingZone } from '../types/shipping-zone';
import { Promotion } from '../types/promotion';

/**
 * Loads customers from CSV file.
 * Defaults: level = 'BASIC', shipping_zone = 'ZONE1', currency = 'EUR'
 * @returns Map of customer_id → Customer
 */
export const loadCustomers = (): Record<string, Customer> => {
  const customers = readCsv(DATA_PATHS.CUSTOMERS, (parts) => ({
    id: parts[0],
    name: parts[1],
    level: (parts[2] || 'BASIC') as 'BASIC' | 'PREMIUM',
    shipping_zone: parts[3] || 'ZONE1',
    currency: parts[4] || 'EUR',
  }));

  return Object.fromEntries(customers.map((c) => [c.id, c]));
};
/**
 * Loads products from CSV file.
 * Defaults: weight = 1.0kg
 * @returns Map of product_id → Product
 */
export const loadProducts = (): Record<string, Product> => {
  const products = readCsv(DATA_PATHS.PRODUCTS, (parts) => ({
    id: parts[0],
    name: parts[1],
    category: parts[2],
    price: parseFloat(parts[3]),
    weight: parseFloat(parts[4] || '1.0'),
    taxable: parts[5] === 'true',
  }));

  return Object.fromEntries(products.map((p) => [p.id, p]));
};
/**
 * Loads orders from CSV file.
 * Defaults: promo_code = '', time = '12:00'
 * @returns List of orders
 */
export const loadOrders = (): Order[] =>
  readCsv(DATA_PATHS.ORDERS, (parts) => ({
    id: parts[0],
    customer_id: parts[1],
    product_id: parts[2],
    qty: parseInt(parts[3]),
    unit_price: parseFloat(parts[4]),
    date: parts[5],
    promo_code: parts[6] || '',
    time: (parts[7] || '12:00').trim(),
  }));
/**
 * Loads shipping zones from CSV file.
 * Defaults: per_kg = 0.5€
 * @returns Map of zone_id → ShippingZone
 */
export const loadShippingZones = (): Record<string, ShippingZone> => {
  const zones = readCsv(DATA_PATHS.SHIPPING_ZONES, (parts) => ({
    zone: parts[0],
    base: parseFloat(parts[1]),
    per_kg: parseFloat(parts[2] || '0.5'),
  }));
  return Object.fromEntries(zones.map((z) => [z.zone, z]));
};
/**
 * Loads promotions from CSV file.
 * Returns an empty map if the file does not exist (promotions are optional).
 * @returns Map of promo_code → Promotion
 */
export const loadPromotions = (): Record<string, Promotion> => {
  try {
    const promos = readCsv(DATA_PATHS.PROMOTIONS, (parts) => ({
      code: parts[0],
      type: parts[1] as 'PERCENTAGE' | 'FIXED',
      value: parseFloat(parts[2]),
      active: parts[3]?.trim() !== 'false',
    }));
    return Object.fromEntries(promos.map((p) => [p.code, p]));
  } catch {
    // Fichier promotions optionnel
    return {};
  }
};
