import { describe, expect, it } from 'vitest';
import {
  BRAND_ASSET_BASE,
  BRAND_NAME,
  BRAND_TAGLINE,
  brandAssets,
} from '../assets';
import { colors } from '../colors';

describe('brand assets (Final Approval Pack)', () => {
  it('exposes canonical paths under /brand/velocitymaid', () => {
    expect(BRAND_ASSET_BASE).toBe('/brand/velocitymaid');
    for (const path of Object.values(brandAssets)) {
      expect(path.startsWith(`${BRAND_ASSET_BASE}/`)).toBe(true);
      expect(path.endsWith('.png')).toBe(true);
    }
  });

  it('keeps official name and tagline', () => {
    expect(BRAND_NAME).toBe('VelocityMaid');
    expect(BRAND_TAGLINE).toBe('COME HOME TO CLEAN');
  });

  it('matches approved palette tokens', () => {
    expect(colors.primaryNavy).toBe('#0F1C2E');
    expect(colors.primaryCyan).toBe('#00C2CB');
    expect(colors.white).toBe('#FFFFFF');
  });
});
