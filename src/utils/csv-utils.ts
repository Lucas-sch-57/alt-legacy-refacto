import fs from 'fs';
export const parseCsv = <T>(content: string, mapper: (parts: string[]) => T): T[] => {
    return content.split('\n').filter(l => l.trim()).slice(1).map(line => mapper(line.split(',')));
}

export const readCsv = <T>(filePath: string, mapper: (parts: string[]) => T): T[] => {
    const content = fs.readFileSync(filePath, 'utf-8');
    return parseCsv(content, mapper);
}