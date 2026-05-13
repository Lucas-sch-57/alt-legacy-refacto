import path from 'path';
import { parseCsv } from './utils/csv-utils';
const base = __dirname;
const custPath = path.join(base, '../legacy/data', 'customers.csv');
parseCsv(custPath);

