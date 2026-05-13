import path from 'path';
import fs from 'fs';
import {
  loadCustomers,
  loadProducts,
  loadOrders,
  loadShippingZones,
  loadPromotions,
} from './services/data-loader';
import {
  calculateLoyaltyPoints,
  calculateLoyaltyDiscount,
  calculateVolumeDiscount,
  calculateLineTotal,
  calculateTax,
  calculateShipping,
  calculateHandlingFee,
  calculateTotal,
  convertTax,
} from './services/calculators';
import { formatCustomerReport, formatSummary, formatJsonOutput } from './services/formatter';
import { CustomerTotal } from './types/customer';
import { FormatterData } from './types/formatter';
import { MAX_TOTAL_DISCOUNT } from './constants/constants';

export const run = (): string => {
  // Chargement des données
  const customers = loadCustomers();
  const products = loadProducts();
  const orders = loadOrders();
  const shippingZones = loadShippingZones();
  const promotions = loadPromotions();

  // Calcul des points de fidélité
  const loyaltyPoints = calculateLoyaltyPoints(orders);

  const totalsByCustomer: Record<string, CustomerTotal> = {};

  for (const order of orders) {
    const product = products[order.product_id];
    const basePrice = product?.price ?? order.unit_price;

    const { lineTotal, morningBonus } = calculateLineTotal(order, basePrice, promotions);

    if (!totalsByCustomer[order.customer_id]) {
      totalsByCustomer[order.customer_id] = {
        subtotal: 0,
        items: [],
        weight: 0,
        promoDiscount: 0,
        morningBonus: 0,
      };
    }

    totalsByCustomer[order.customer_id].subtotal += lineTotal;
    totalsByCustomer[order.customer_id].weight += (product?.weight ?? 1.0) * order.qty;
    totalsByCustomer[order.customer_id].items.push(order);
    totalsByCustomer[order.customer_id].morningBonus += morningBonus;
  }

  // Génération du rapport
  const outputLines: string[] = [];
  const formatterDataList: FormatterData[] = [];
  let grandTotal = 0.0;
  let totalTaxCollected = 0.0;

  const sortedCustomerIds = Object.keys(totalsByCustomer).sort();

  for (const customerId of sortedCustomerIds) {
    const customer = customers[customerId] ?? {
      id: customerId,
      name: 'Unknown',
      level: 'BASIC',
      shipping_zone: 'ZONE1',
      currency: 'EUR',
    };
    const customerTotal = totalsByCustomer[customerId];

    // Calcul des remises
    const volumeDiscount = calculateVolumeDiscount(customerTotal);
    const points = loyaltyPoints[customerId] ?? 0;
    const loyaltyDiscount = calculateLoyaltyDiscount(points);

    // Plafond de remise global
    let totalDiscount = volumeDiscount + loyaltyDiscount;
    let adjVolumeDiscount = volumeDiscount;
    let adjLoyaltyDiscount = loyaltyDiscount;
    if (totalDiscount > MAX_TOTAL_DISCOUNT) {
      const ratio = MAX_TOTAL_DISCOUNT / totalDiscount;
      adjVolumeDiscount = volumeDiscount * ratio;
      adjLoyaltyDiscount = loyaltyDiscount * ratio;
      totalDiscount = MAX_TOTAL_DISCOUNT;
    }

    // Calcul taxe, shipping, handling
    const taxable = customerTotal.subtotal - totalDiscount;
    const tax = calculateTax(taxable, customerTotal.items, products);
    const shipping = calculateShipping(customerTotal, customer, shippingZones);
    const handling = calculateHandlingFee(customerTotal);
    const total = calculateTotal(taxable, tax, shipping, handling, customer.currency);

    grandTotal += total;
    totalTaxCollected += convertTax(tax, customer.currency);

    const formatterData: FormatterData = {
      customer,
      customerTotal,
      totalDiscount,
      volumeDiscount: adjVolumeDiscount,
      loyaltyDiscount: adjLoyaltyDiscount,
      tax,
      shipping,
      handling,
      total,
      loyaltyPoints: points,
    };

    formatterDataList.push(formatterData);
    outputLines.push(formatCustomerReport(formatterData));
  }

  // Résumé global
  outputLines.push(formatSummary({ grandTotal, totalTaxCollected }));

  const result = outputLines.join('\n');

  // Affichage + export JSON
  console.log(result);
  fs.writeFileSync(path.join(__dirname, '../output.json'), formatJsonOutput(formatterDataList));

  return result;
};

if (require.main === module) {
  run();
}
