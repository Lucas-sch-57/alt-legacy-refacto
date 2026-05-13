import { Customer } from "../types/customer";
import { readCsv } from "../utils/csv-utils";
import {DATA_PATHS} from '../constants/constants';
export const loadCustomers= (): Customer[] {
    readCsv(DATA_PATHS.CUSTOMERS)
}