export const dynamic = 'force-dynamic'

/**
 * Office Cleaning Checklist PDF
 * GET /api/brand/nj/corporate/office-checklist
 */

import { NextRequest, NextResponse } from 'next/server';

const brandColors = {
  primary: '#0A3D2F',
  accent: '#F8C548',
  white: '#FFFFFF',
  gray: '#F1F1EB',
};

export async function GET(request: NextRequest) {
  try {
    const html = generateOfficeChecklist();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-office-cleaning-checklist.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate office checklist error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate office checklist' },
      { status: 500 }
    );
  }
}

function generateOfficeChecklist(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Office Cleaning Checklist</title>
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    body {
      font-family: 'Inter', Arial, sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 0;
    }
    .header {
      background: ${brandColors.primary};
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 42px;
      font-weight: bold;
      color: ${brandColors.accent};
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      margin-bottom: 10px;
    }
    .title {
      font-size: 32px;
      font-weight: bold;
      margin: 15px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .checklist-section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .checklist-section h2 {
      font-size: 24px;
      color: ${brandColors.primary};
      margin: 0 0 20px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      border-bottom: 3px solid ${brandColors.accent};
      padding-bottom: 10px;
    }
    .checklist-items {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .checklist-item {
      display: flex;
      align-items: start;
      padding: 12px;
      background: ${brandColors.gray};
      border-radius: 6px;
      font-size: 14px;
      border-left: 3px solid ${brandColors.accent};
    }
    .check {
      color: ${brandColors.accent};
      font-weight: bold;
      margin-right: 10px;
      font-size: 18px;
      flex-shrink: 0;
    }
    .signature-section {
      margin: 40px 0;
      padding: 20px;
      border: 2px solid ${brandColors.primary};
      border-radius: 8px;
    }
    .signature-line {
      border-bottom: 2px solid #333;
      height: 50px;
      margin: 20px 0 10px 0;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">VelocityMaid</div>
    <div style="font-size: 18px; color: rgba(255,255,255,0.9);">New Jersey</div>
    <h1 class="title">Office Cleaning Checklist</h1>
    <p style="font-size: 18px; margin: 10px 0 0 0;">Complete cleaning verification for office spaces</p>
  </div>

  <div class="checklist-section">
    <h2>Workstations & Desks</h2>
    <div class="checklist-items">
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Desk surfaces wiped and sanitized</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Computer monitors cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Keyboards and phones sanitized</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Desk drawers (if accessible) organized</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Trash emptied</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Recycling bins emptied</span>
      </div>
    </div>
  </div>

  <div class="checklist-section">
    <h2>Restrooms</h2>
    <div class="checklist-items">
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Toilets cleaned and sanitized</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Sinks and faucets polished</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Mirrors cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Floors mopped and sanitized</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Paper products restocked</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Soap dispensers refilled</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Trash emptied</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>All fixtures polished</span>
      </div>
    </div>
  </div>

  <div class="checklist-section">
    <h2>Common Areas</h2>
    <div class="checklist-items">
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Reception area cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Conference rooms cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>All surfaces dusted</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Floors vacuumed</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Hard floors mopped</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Baseboards cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Window sills cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Light fixtures cleaned</span>
      </div>
    </div>
  </div>

  <div class="checklist-section">
    <h2>Break Room / Kitchen</h2>
    <div class="checklist-items">
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Countertops cleaned and sanitized</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Microwave cleaned (inside and out)</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Refrigerator exterior cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Sink and faucet polished</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Tables and chairs cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Floors mopped</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Trash and recycling emptied</span>
      </div>
    </div>
  </div>

  <div class="signature-section">
    <h3 style="color: ${brandColors.primary}; font-size: 18px; margin: 0 0 20px 0; font-family: 'Montserrat', 'Poppins', Arial, sans-serif;">
      Quality Verification
    </h3>
    <p style="margin-bottom: 30px;">This checklist confirms that all items above have been completed to VelocityMaid standards.</p>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
      <div>
        <div class="signature-line"></div>
        <p style="font-size: 12px; color: #666; margin: 0;">Cleaner Signature</p>
      </div>
      <div>
        <div class="signature-line"></div>
        <p style="font-size: 12px; color: #666; margin: 0;">Date</p>
      </div>
    </div>
    <div style="margin-top: 40px;">
      <div class="signature-line"></div>
      <p style="font-size: 12px; color: #666; margin: 0;">Client Approval</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}


