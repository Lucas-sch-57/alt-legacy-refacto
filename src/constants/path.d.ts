import path from 'path';
const DATA_DIR = path.join(__dirname, '../legacy/data');

export const DATA_PATHS= {
    CUSTOMERS: path.join(DATA_DIR, 'customers.csv'),
    PRODUCTS: path.join(DATA_DIR, 'products.csv'),
    ORDERS: path.join(DATA_DIR, 'orders.csv'),
    PROMOTIONS: path.join(DATA_DIR, 'promotions.csv'),
    SHIPPING_ZONES: path.join(DATA_DIR, 'shipping_zones.csv')
} as const;