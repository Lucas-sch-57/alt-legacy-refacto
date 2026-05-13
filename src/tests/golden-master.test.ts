import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
describe('Golden Master Test', () => {
  it('should match the expected output', () => {
    const refactored = execSync('ts-node src/index.ts').toString().trim();
    const legacy = fs
      .readFileSync(path.join(__dirname, '../../legacy/expected/report.txt'), 'utf-8')
      .trim();
    expect(refactored).toBe(legacy);
  });
});
