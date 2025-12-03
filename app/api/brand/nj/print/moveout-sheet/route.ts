/**
 * VelocityMaid New Jersey Move-Out Sheet Generator
 * GET /api/brand/nj/print/moveout-sheet
 * 
 * Generates 8.5x11 move-out cleaning checklist as HTML (printable to PDF)
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
    const html = generateMoveOutSheet();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-moveout-sheet.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate move-out sheet error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate move-out sheet' },
      { status: 500 }
    );
  }
}

function generateMoveOutSheet(): string {
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
      margin: 0;
      padding: 0;
      font-family: 'Inter', Arial, sans-serif;
      background: white;
      color: #333;
    }
    .sheet {
      width: 8.5in;
      min-height: 11in;
      padding: 0.5in;
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
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      font-size: 42px;
      font-weight: bold;
      color: ${brandColors.accent};
      margin-bottom: 10px;
    }
    .title {
      font-size: 28px;
      font-weight: bold;
      margin: 15px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .pricing-box {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 25px;
      border-radius: 8px;
      text-align: center;
      margin: 30px 0;
    }
    .pricing-box h2 {
      font-size: 32px;
      font-weight: bold;
      margin: 0 0 10px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .pricing-box p {
      font-size: 18px;
      margin: 5px 0;
    }
    .checklist {
      margin: 30px 0;
    }
    .checklist h3 {
      font-size: 22px;
      color: ${brandColors.primary};
      margin: 0 0 20px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      border-bottom: 2px solid ${brandColors.accent};
      padding-bottom: 10px;
    }
    .checklist-section {
      margin: 25px 0;
    }
    .checklist-section h4 {
      font-size: 18px;
      color: ${brandColors.primary};
      margin: 0 0 15px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .checklist-items {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .checklist-item {
      display: flex;
      align-items: start;
      padding: 10px;
      background: ${brandColors.gray};
      border-radius: 6px;
      font-size: 14px;
    }
    .check {
      color: ${brandColors.accent};
      font-weight: bold;
      margin-right: 10px;
      font-size: 18px;
      flex-shrink: 0;
    }
    .cta-section {
      background: ${brandColors.primary};
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin: 30px 0;
    }
    .cta-section h2 {
      font-size: 28px;
      font-weight: bold;
      margin: 0 0 15px 0;
      color: ${brandColors.accent};
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .qr-section {
      margin: 20px 0;
    }
    .qr-placeholder {
      width: 180px;
      height: 180px;
      background: white;
      border: 3px dashed ${brandColors.accent};
      margin: 0 auto 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${brandColors.primary};
      font-size: 11px;
      text-align: center;
      padding: 10px;
      border-radius: 8px;
    }
    .contact {
      text-align: center;
      margin: 20px 0;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle" style="font-size: 18px; color: rgba(255,255,255,0.9);">New Jersey</div>
      <h1 class="title">Move-Out Cleaning Checklist</h1>
      <p style="font-size: 16px; margin: 10px 0 0 0;">Complete cleaning service for your move-out</p>
    </div>

    <div class="pricing-box">
      <h2>Flat-Rate Move-Out Cleaning</h2>
      <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">Starting at $320</p>
      <p>Includes everything on this checklist</p>
    </div>

    <div class="checklist">
      <h3>Complete Move-Out Cleaning Includes:</h3>

      <div class="checklist-section">
        <h4>Kitchen</h4>
        <div class="checklist-items">
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Inside all cabinets and drawers</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Oven deep clean (inside & out)</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Refrigerator (inside & out)</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Dishwasher (inside & out)</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Microwave (inside & out)</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Countertops & backsplash</span>
          </div>
        </div>
      </div>

      <div class="checklist-section">
        <h4>Bathrooms</h4>
        <div class="checklist-items">
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Toilet (inside & out)</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Shower/Tub deep scrub</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Mirrors & glass</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Vanity & cabinets</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Floors & baseboards</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>All fixtures polished</span>
          </div>
        </div>
      </div>

      <div class="checklist-section">
        <h4>Living Areas</h4>
        <div class="checklist-items">
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Dust all surfaces</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Vacuum all carpets</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Mop all hard floors</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Baseboards cleaned</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Window sills</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Light fixtures</span>
          </div>
        </div>
      </div>

      <div class="checklist-section">
        <h4>Bedrooms</h4>
        <div class="checklist-items">
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Dust all surfaces</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Vacuum carpets</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Inside closets</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Baseboards</span>
          </div>
        </div>
      </div>

      <div class="checklist-section">
        <h4>Additional Services</h4>
        <div class="checklist-items">
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Interior window cleaning</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Wall spot cleaning</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Ceiling fans</span>
          </div>
          <div class="checklist-item">
            <span class="check">✓</span>
            <span>Final inspection</span>
          </div>
        </div>
      </div>
    </div>

    <div class="cta-section">
      <h2>Ready to Book Your Move-Out Clean?</h2>
      <div class="qr-section">
        <div class="qr-placeholder">
          QR Code<br><br>Scan to Book<br><br>velocitymaid.com/new-jersey
        </div>
        <p style="font-size: 18px; margin: 0;">Scan to book online</p>
      </div>
      <div class="contact">
        <p><strong>Book Now:</strong> velocitymaid.com/new-jersey</p>
        <p><strong>Call:</strong> (555) 123-4567</p>
        <p style="font-size: 14px; margin-top: 15px;">100% Satisfaction Guarantee • Insured & Bonded</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

