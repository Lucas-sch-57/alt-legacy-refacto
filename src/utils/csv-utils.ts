import fs from 'fs';
/**
 * Parses a CSV string into a typed array using a mapper function.
 * Skips the header row automatically.
 * @param content - Raw CSV string content
 * @param mapper - Function that transforms a row's string parts into type T
 * @returns Array of mapped objects
 */
export const parseCsv = <T>(content: string, mapper: (parts: string[]) => T): T[] => {
  return content
    .split('\n')
    .filter((l) => l.trim())
    .slice(1)
    .map((line) => mapper(line.split(',')));
};
/**
 * Reads a CSV file from disk and parses it into a typed array.
 * @param filePath - Absolute path to the CSV file
 * @param mapper - Function that transforms a row's string parts into type T
 * @returns Array of mapped objects
 */
export const readCsv = <T>(filePath: string, mapper: (parts: string[]) => T): T[] => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseCsv(content, mapper);
};
