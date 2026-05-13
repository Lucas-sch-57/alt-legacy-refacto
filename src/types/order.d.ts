export interface Order {
    id: string;
    customer_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    date: string;
    promo_code: string;
    time: string;
}