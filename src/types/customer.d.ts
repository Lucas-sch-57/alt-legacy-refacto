export interface Customer {
  id: string;
  name: string;
  level: 'BASIC' | 'PREMIUM';
  shipping_zone: string;
  currency: string;
}

export interface CustomerTotal {
  subtotal: number;
  items: Order[];
  weight: number;
  promoDiscount: number;
  morningBonus: number;
}
