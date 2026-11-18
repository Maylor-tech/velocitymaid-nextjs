import { describe, expect, it } from 'vitest';
import {
  BRAND_ASSET_BASE,
  BRAND_NAME,
  BRAND_TAGLINE,
  brandAssets,
} from '../assets';
import { colors, approvedContrastPairs } from '../colors';

describe('brand assets (logo v2.3)', () => {
  it('exposes canonical paths under /brand/velocitymaid', () => {
    expect(BRAND_ASSET_BASE).toBe('/brand/velocitymaid');
    for (const path of Object.values(brandAssets)) {
      expect(path.startsWith(`${BRAND_ASSET_BASE}/`)).toBe(true);
      expect(path.endsWith('.svg')).toBe(true);
    }
  });

  it('keeps official name and tagline', () => {
    expect(BRAND_NAME).toBe('VelocityMaid');
    expect(BRAND_TAGLINE).toBe('COME HOME TO CLEAN');
  });

  it('matches approved palette tokens (v2.3)', () => {
    expect(colors.primaryNavy).toBe('#0F1C2E');
    expect(colors.primaryCyan).toBe('#00C2CB');
    expect(colors.cyanDark).toBe('#007B84');
    expect(colors.surface).toBe('#F5F7FA');
    expect(colors.text).toBe('#1B2D42');
    expect(colors.muted).toBe('#65778C');
    expect(colors.white).toBe('#FFFFFF');
  });

  it('marks white-on-cyan as not accessible', () => {
    const whiteOnCyan = approvedContrastPairs.find(
      (p) => p.fg === 'White' && p.bg === 'Cyan'
    );
    expect(whiteOnCyan?.passesAA).toBe(false);
  });
});
