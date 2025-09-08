import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

describe('index.html offline readiness', () => {
  it('does not rely on ES module imports', async () => {
    const html = await readFile(join('src', 'index.html'), 'utf8');
    expect(html).not.toMatch(/<script[^>]*type="module"/);
    expect(html).not.toMatch(/\bimport\s/);
  });
});
