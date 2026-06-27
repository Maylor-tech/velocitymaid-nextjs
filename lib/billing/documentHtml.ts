const NAVY = '#0F1C2E';
const CYAN = '#00C2CB';
const SURFACE = '#F4F6F9';
const MUTED = '#6B7280';
const FONT = "'Helvetica Neue', Arial, sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function brandedDocumentShell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<style>
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  body { margin: 0; padding: 32px 16px; background: ${SURFACE}; font-family: ${FONT}; color: ${NAVY}; }
  .doc { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
  .header { background: ${NAVY}; padding: 28px 32px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .brand { font-size: 22px; font-weight: 700; color: #fff; margin: 0; }
  .tagline { margin: 6px 0 0; font-size: 13px; color: ${CYAN}; }
  .doc-type { text-align: right; color: #fff; }
  .doc-type h2 { margin: 0; font-size: 18px; letter-spacing: 0.04em; }
  .doc-type p { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }
  .content { padding: 32px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${MUTED}; margin: 0 0 6px; }
  .value { font-size: 15px; margin: 0; line-height: 1.5; }
  .section { margin-top: 24px; padding-top: 20px; border-top: 1px solid #E2E8F0; }
  .section h3 { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: ${NAVY}; }
  .photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
  .photo { border-radius: 8px; overflow: hidden; border: 1px solid #E2E8F0; }
  .photo img { width: 100%; height: 120px; object-fit: cover; display: block; }
  .photo p { margin: 0; padding: 6px 8px; font-size: 11px; color: ${MUTED}; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 10px 0; border-bottom: 1px solid #E2E8F0; text-align: left; font-size: 14px; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: ${MUTED}; }
  td.amount { text-align: right; font-weight: 600; }
  .total-row td { border-bottom: none; font-size: 16px; font-weight: 700; padding-top: 16px; }
  .footer { padding: 20px 32px; background: #F8FAFC; font-size: 12px; color: ${MUTED}; text-align: center; }
  .print-btn { display: inline-block; margin: 16px auto 0; padding: 10px 20px; background: ${NAVY}; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
</style>
</head>
<body>
<div class="doc">
  ${body}
</div>
<div class="no-print" style="text-align:center;margin-top:16px;">
  <button class="print-btn" onclick="window.print()">Download / Print PDF</button>
</div>
</body>
</html>`;
}

export function documentHeader(docType: string, docNumber: string): string {
  return `<div class="header">
    <div>
      <p class="brand">VelocityMaid</p>
      <p class="tagline">Come Home to Clean</p>
    </div>
    <div class="doc-type">
      <h2>${escapeHtml(docType)}</h2>
      <p>#${escapeHtml(docNumber)}</p>
    </div>
  </div>`;
}

export { NAVY, CYAN, SURFACE, MUTED, FONT };
