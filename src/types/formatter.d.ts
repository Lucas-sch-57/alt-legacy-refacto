import { Customer, CustomerTotal } from './customer';

export interface FormatterData {
  customer: Customer;
  customerTotal: CustomerTotal;
  totalDiscount: number;
  volumeDiscount: number;
  loyaltyDiscount: number;
  tax: number;
  shipping: number;
  handling: number;
  total: number;
  loyaltyPoints: number;
}

export interface ReportSummary {
  grandTotal: number;
  totalTaxCollected: number;
}
