import { brandAssets } from '@/lib/brand/assets';
import { colors } from '@/lib/brand/colors';

const NAVY = colors.primaryNavy;
const CYAN = colors.primaryCyan;
const SURFACE = colors.surface;
const FONT = "'Helvetica Neue', Arial, sans-serif";

function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'https://www.velocitymaid.com'
  );
}

/** Absolute URL to approved email header lockup (reversed on navy plate). */
export function brandEmailLogoUrl(): string {
  return `${appOrigin()}${brandAssets.reversedPlate}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Navy header cell with approved reversed lockup (for custom email shells). */
export function brandEmailHeaderRow(): string {
  const logoUrl = brandEmailLogoUrl();
  return `<tr><td style="background:${NAVY};padding:20px 28px;" align="left">
<img src="${escapeHtml(logoUrl)}" alt="VelocityMaid — COME HOME TO CLEAN" width="220" height="76" style="display:block;width:220px;height:auto;max-width:100%;border:0;outline:none;text-decoration:none;" />
</td></tr>`;
}

export function brandHtmlBlock(title: string, body: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${SURFACE};font-family:${FONT};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">
${brandEmailHeaderRow()}
<tr><td style="padding:28px;">${body}</td></tr>
</table></td></tr></table></body></html>`;
}

export { NAVY, CYAN, SURFACE };
export const MUTED = colors.muted;
