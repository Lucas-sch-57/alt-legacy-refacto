export interface Promotion {
    code: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    active: boolean
}