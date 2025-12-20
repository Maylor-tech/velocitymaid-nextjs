export const dynamic = 'force-dynamic'

/**
 * VelocityMaid New Jersey Move-Out Cleaning Checklist
 * GET /api/brand/nj/partners/moveout-checklist
 * 
 * Generates move-out checklist as HTML (printable to PDF)
 */

import { NextRequest, NextResponse } from 'next/server';

const brandColors = {
  primary: '#0A3D2F',
  accent: '#F8C548',
  white: '#FFFFFF',
  gray: '#F1F1F1',
};

export async function GET(request: NextRequest) {
  try {
    const html = generateMoveOutChecklist();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-moveout-checklist.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate move-out checklist error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate checklist' },
      { status: 500 }
    );
  }
}

function generateMoveOutChecklist(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Move-Out Cleaning Checklist</title>
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
    <h1 class="title">Move-Out Cleaning Checklist</h1>
    <p style="font-size: 18px; margin: 10px 0 0 0;">Complete cleaning verification for apartment turnover</p>
  </div>

  <div class="checklist-section">
    <h2>Kitchen</h2>
    <div class="checklist-items">
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Inside all cabinets and drawers cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Oven cleaned (inside and out)</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Refrigerator cleaned (inside and out)</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Dishwasher cleaned (inside and out)</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Microwave cleaned (inside and out)</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Countertops and backsplash cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Sink and faucet polished</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Stovetop and range hood cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Floors vacuumed and mopped</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Baseboards cleaned</span>
      </div>
    </div>
  </div>

  <div class="checklist-section">
    <h2>Bathrooms</h2>
    <div class="checklist-items">
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Toilet cleaned (inside and out)</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Shower/Tub deep scrubbed</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Mirrors and glass cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Vanity and cabinets cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Sink and faucet polished</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Floors mopped and sanitized</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Baseboards cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>All fixtures polished</span>
      </div>
    </div>
  </div>

  <div class="checklist-section">
    <h2>Living Areas</h2>
    <div class="checklist-items">
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>All surfaces dusted</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Carpets vacuumed</span>
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
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Ceiling fans cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Interior windows cleaned</span>
      </div>
    </div>
  </div>

  <div class="checklist-section">
    <h2>Bedrooms</h2>
    <div class="checklist-items">
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>All surfaces dusted</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Carpets vacuumed</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Inside closets cleaned</span>
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
    <h2>Additional Services</h2>
    <div class="checklist-items">
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Wall spot cleaning</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Door frames cleaned</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Trash removal</span>
      </div>
      <div class="checklist-item">
        <span class="check">☐</span>
        <span>Final inspection completed</span>
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
      <p style="font-size: 12px; color: #666; margin: 0;">Property Manager Approval</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}


