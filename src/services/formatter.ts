import { FormatterData, ReportSummary } from '../types/formatter';
import { CURRENCY_RATES } from '../constants/constants';
/**
 * Formats a single customer report block as a string.
 * Includes subtotal, discounts, tax, shipping, handling, total and loyalty points.
 * Tax is converted to the customer's currency before display.
 * Morning bonus line is only shown if applicable.
 * @param data - All computed data for the customer
 * @returns Formatted report block ending with an empty line
 */
export const formatCustomerReport = (data: FormatterData): string => {
  const lines: string[] = [];
  const { customer, customerTotal } = data;

  lines.push(`Customer: ${customer.name} (${customer.id})`);
  lines.push(
    `Level: ${customer.level} | Zone: ${customer.shipping_zone} | Currency: ${customer.currency}`,
  );
  lines.push(`Subtotal: ${customerTotal.subtotal.toFixed(2)}`);
  lines.push(`Discount: ${data.totalDiscount.toFixed(2)}`);
  lines.push(`  - Volume discount: ${data.volumeDiscount.toFixed(2)}`);
  lines.push(`  - Loyalty discount: ${data.loyaltyDiscount.toFixed(2)}`);

  if (customerTotal.morningBonus > 0) {
    lines.push(`  - Morning bonus: ${customerTotal.morningBonus.toFixed(2)}`);
  }

  const convertedTax = data.tax * (CURRENCY_RATES[customer.currency] ?? CURRENCY_RATES['EUR']);
  lines.push(`Tax: ${convertedTax.toFixed(2)}`);
  lines.push(
    `Shipping (${customer.shipping_zone}, ${customerTotal.weight.toFixed(1)}kg): ${data.shipping.toFixed(2)}`,
  );

  if (data.handling > 0) {
    lines.push(`Handling (${customerTotal.items.length} items): ${data.handling.toFixed(2)}`);
  }

  lines.push(`Total: ${data.total.toFixed(2)} ${customer.currency}`);
  lines.push(`Loyalty Points: ${Math.floor(data.loyaltyPoints)}`);
  lines.push('');

  return lines.join('\n');
};
/**
 * Formats the report summary (grand total and total tax collected).
 * Amounts are always displayed in EUR regardless of customer currencies.
 * @param summary - Grand total and total tax collected
 * @returns Formatted summary string
 */
export const formatSummary = (summary: ReportSummary): string => {
  const lines: string[] = [];
  lines.push(`Grand Total: ${summary.grandTotal.toFixed(2)} EUR`);
  lines.push(`Total Tax Collected: ${summary.totalTaxCollected.toFixed(2)} EUR`);
  return lines.join('\n');
};
/**
 * Formats the full report data as a JSON string for file export.
 * Each entry contains customer_id, name, total, currency and loyalty_points.
 * @param data - List of all customer report data
 * @returns Pretty-printed JSON string
 */
export const formatJsonOutput = (data: FormatterData[]): string => {
  const jsonData = data.map((d) => ({
    customer_id: d.customer.id,
    name: d.customer.name,
    total: d.total,
    currency: d.customer.currency,
    loyalty_points: Math.floor(d.loyaltyPoints),
  }));
  return JSON.stringify(jsonData, null, 2);
};
