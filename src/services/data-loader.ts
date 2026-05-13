import { Customer } from "../types/customer";
import { readCsv } from "../utils/csv-utils";
import {DATA_PATHS} from '../constants/constants';
import { Product } from "../types/product";
export const loadCustomers= (): Customer[] =>
    readCsv(DATA_PATHS.CUSTOMERS, (parts) => ({
        id: parts[0],
        name: parts[1],
        level: (parts[2] || 'BASIC') as 'BASIC' | 'PREMIUM',
        shipping_zone: parts[3] || 'ZONE1',
        currency: parts[4] || 'EUR',
    }))

export const loadProducts =(): Product[] =>
    readCsv(DATA_PATHS.PRODUCTS, (parts)=>({
           id: parts[0],
    name: parts[1],
    category: parts[2],
    price: parseFloat(parts[3]),
    weight: parseFloat(parts[4] || '1.0'),
    taxable: parts[5] === 'true',
    }))