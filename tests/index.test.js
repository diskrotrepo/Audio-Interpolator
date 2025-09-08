import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

describe('index.html offline readiness', () => {
  it('does not rely on ES module imports', async () => {
    const html = await readFile(join('src', 'index.html'), 'utf8');
    expect(html).not.toMatch(/<script[^>]*type="module"/);
    expect(html).not.toMatch(/\bimport\s/);
  });

  it('uses a single file input that accepts multiple files', async () => {
    const html = await readFile(join('src', 'index.html'), 'utf8');
    const inputs = html.match(/<input[^>]*type="file"[^>]*>/g) || [];
    expect(inputs.length).toBe(1);
    expect(inputs[0]).toMatch(/multiple/);
  });

  it('includes a normalization toggle', async () => {
    const html = await readFile(join('src', 'index.html'), 'utf8');
    const toggle = html.match(/<input[^>]*id="normalizeToggle"[^>]*>/);
    expect(toggle).not.toBeNull();
    expect(toggle[0]).toMatch(/type="checkbox"/);
  });
});
