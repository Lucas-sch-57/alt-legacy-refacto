import fs from 'fs';
export const parseCsv = (content: string): string[][] => {
    return content.split('\n').filter(l => l.trim()).slice(1).map(line => line.split(','));
}

export const readCsv = (filePath: string): string[][] => {
    const content = fs.readFileSync(filePath, 'utf-8');
    return parseCsv(content);
}