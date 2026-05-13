import { Customer } from "../types/customer";
import { readCsv } from "../utils/csv-utils";
import {DATA_PATHS} from '../constants/constants';
export const loadCustomers= (): Customer[] =>
    readCsv(DATA_PATHS.CUSTOMERS, (parts) => ({
        id: parts[0],
        name: parts[1],
        level: (parts[2] || 'BASIC') as 'BASIC' | 'PREMIUM',
        shipping_zone: parts[3] || 'ZONE1',
        currency: parts[4] || 'EUR',
    }))

