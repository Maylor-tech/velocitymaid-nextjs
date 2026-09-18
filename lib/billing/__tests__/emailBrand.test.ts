import { describe, expect, it } from 'vitest';
import {
  brandEmailHeaderRow,
  brandEmailLogoUrl,
  brandHtmlBlock,
  escapeHtml,
} from '../emailBrand';

describe('emailBrand', () => {
  it('escapes HTML entities', () => {
    expect(escapeHtml(`<"&'>`)).toBe('&lt;&quot;&amp;&#39;&gt;');
  });

  it('embeds approved logo image in email header', () => {
    const row = brandEmailHeaderRow();
    expect(row).toContain(brandEmailLogoUrl());
    expect(row).toContain('alt="VelocityMaid — COME HOME TO CLEAN"');
    expect(row).not.toContain('>VelocityMaid</p>');
  });

  it('builds full branded HTML shell with image header', () => {
    const html = brandHtmlBlock('Test', '<p>Hello</p>');
    expect(html).toContain('<img');
    expect(html).toContain('/brand/velocitymaid/velocitymaid-reversed.png');
    expect(html).toContain('<p>Hello</p>');
  });
});
