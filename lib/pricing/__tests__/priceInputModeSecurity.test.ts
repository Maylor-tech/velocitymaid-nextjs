/**
 * Documents which routes may use priceInputMode='customer'.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '../../..');

function read(rel: string) {
  return readFileSync(join(root, rel), 'utf8');
}

describe('priceInputMode security boundary', () => {
  it('only admin create-manual references priceInputMode', () => {
    const createManual = read('app/api/admin/jobs/create-manual/route.ts');
    expect(createManual).toMatch(/requireRole\(request,\s*["']ADMIN["']\)/);
    expect(createManual).toMatch(/priceInputMode/);

    const checkout = read('app/api/checkout/route.ts');
    expect(checkout).not.toMatch(/priceInputMode/);

    const quote = read('app/api/booking/quote/route.ts');
    expect(quote).not.toMatch(/priceInputMode/);

    const checkoutPricing = read('lib/booking/checkoutPricing.ts');
    expect(checkoutPricing).toMatch(/priceInputMode[\s\S]*NOT accepted/);
  });

  it('admin jobs/new defaults to operational mode (not customer bypass)', () => {
    const page = read('app/admin/jobs/new/page.tsx');
    expect(page).toMatch(/priceInputMode:\s*["']operational["']/);
  });
});
