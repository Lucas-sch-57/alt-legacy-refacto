export interface Customer {
    id: string;
    name: string;
    level: 'BASIC' | 'PREMIUM';
    shipping_zone: string;
    currency: string;
}