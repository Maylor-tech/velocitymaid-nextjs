const NAVY = '#0F1C2E';
const CYAN = '#00C2CB';
const SURFACE = '#F4F6F9';
const FONT = "'Helvetica Neue', Arial, sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function brandHtmlBlock(title: string, body: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${SURFACE};font-family:${FONT};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">
<tr><td style="background:${NAVY};padding:24px 28px;">
<p style="margin:0;font-size:20px;font-weight:700;color:#fff;">VelocityMaid</p>
<p style="margin:6px 0 0;font-size:13px;color:${CYAN};">Come home to clean.</p>
</td></tr><tr><td style="padding:28px;">${body}</td></tr>
</table></td></tr></table></body></html>`;
}
