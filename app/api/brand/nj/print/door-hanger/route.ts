/**
 * VelocityMaid New Jersey Door Hanger Generator
 * GET /api/brand/nj/print/door-hanger?side={front|back}
 * 
 * Generates door hanger as HTML (printable to PDF)
 * Size: 4.25in x 11in
 */

import { NextRequest, NextResponse } from 'next/server';

const brandColors = {
  primary: '#0A3D2F',
  accent: '#F8C548',
  white: '#FFFFFF',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const side = searchParams.get('side') || 'front';

    const html = side === 'front' ? generateDoorHangerFront() : generateDoorHangerBack();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="velocitymaid-nj-door-hanger-${side}.html"`,
      },
    });
  } catch (error: any) {
    console.error('Generate door hanger error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate door hanger' },
      { status: 500 }
    );
  }
}

function generateDoorHangerFront(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Door Hanger Front</title>
  <style>
    @page {
      size: 4.25in 11in;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      width: 4.25in;
      height: 11in;
      font-family: 'Inter', Arial, sans-serif;
      background: ${brandColors.primary};
      color: white;
      position: relative;
      overflow: hidden;
    }
    .hanger {
      width: 100%;
      height: 100%;
      padding: 0.5in;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .hole {
      position: absolute;
      top: 0.3in;
      left: 50%;
      transform: translateX(-50%);
      width: 0.4in;
      height: 0.4in;
      border-radius: 50%;
      background: white;
      border: 3px solid ${brandColors.accent};
    }
    .header {
      text-align: center;
      margin-top: 0.8in;
    }
    .logo {
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      font-size: 32px;
      font-weight: bold;
      color: ${brandColors.accent};
      margin-bottom: 5px;
    }
    .subtitle {
      font-size: 14px;
      color: white;
      margin-bottom: 20px;
    }
    .promo-badge {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .promo-badge h2 {
      font-size: 36px;
      font-weight: bold;
      margin: 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .promo-badge p {
      font-size: 16px;
      margin: 5px 0 0 0;
      font-weight: 600;
    }
    .pricing {
      background: rgba(255,255,255,0.1);
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .pricing h3 {
      font-size: 18px;
      margin: 0 0 15px 0;
      text-align: center;
      color: ${brandColors.accent};
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      font-size: 14px;
    }
    .price-row:last-child {
      border-bottom: none;
    }
    .price-amount {
      font-weight: bold;
      color: ${brandColors.accent};
    }
    .qr-section {
      text-align: center;
      margin: 20px 0;
    }
    .qr-placeholder {
      width: 150px;
      height: 150px;
      background: white;
      border: 3px dashed ${brandColors.accent};
      margin: 0 auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${brandColors.primary};
      font-size: 10px;
      text-align: center;
      padding: 10px;
      border-radius: 8px;
    }
    .cta {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      font-weight: bold;
      font-size: 16px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: rgba(255,255,255,0.8);
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="hanger">
    <div class="hole"></div>
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    
    <div class="promo-badge">
      <h2>15% OFF</h2>
      <p>First Clean</p>
    </div>

    <div class="pricing">
      <h3>Transparent Pricing</h3>
      <div class="price-row">
        <span>Studio/1BR</span>
        <span class="price-amount">$120</span>
      </div>
      <div class="price-row">
        <span>2 Bedroom</span>
        <span class="price-amount">$150</span>
      </div>
      <div class="price-row">
        <span>3 Bedroom</span>
        <span class="price-amount">$180</span>
      </div>
    </div>

    <div class="qr-section">
      <div class="qr-placeholder">
        QR Code<br><br>Scan to Book<br><br>velocitymaid.com/new-jersey
      </div>
      <p style="font-size: 12px; margin: 0;">Scan to book online</p>
    </div>

    <div class="cta">Book Now</div>

    <div class="footer">
      <p>Professional • Background Checked • Insured</p>
      <p>velocitymaid.com/new-jersey</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateDoorHangerBack(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Door Hanger Back</title>
  <style>
    @page {
      size: 4.25in 11in;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      width: 4.25in;
      height: 11in;
      font-family: 'Inter', Arial, sans-serif;
      background: white;
      color: ${brandColors.primary};
      position: relative;
      overflow: hidden;
    }
    .hanger {
      width: 100%;
      height: 100%;
      padding: 0.5in;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .hole {
      position: absolute;
      top: 0.3in;
      left: 50%;
      transform: translateX(-50%);
      width: 0.4in;
      height: 0.4in;
      border-radius: 50%;
      background: ${brandColors.primary};
      border: 3px solid ${brandColors.accent};
    }
    .header {
      text-align: center;
      margin-top: 0.8in;
      border-bottom: 3px solid ${brandColors.accent};
      padding-bottom: 15px;
    }
    .logo {
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      font-size: 28px;
      font-weight: bold;
      color: ${brandColors.primary};
      margin-bottom: 5px;
    }
    .subtitle {
      font-size: 14px;
      color: #666;
    }
    .checklist {
      margin: 20px 0;
    }
    .checklist h3 {
      font-size: 18px;
      margin: 0 0 15px 0;
      color: ${brandColors.primary};
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .checklist-item {
      display: flex;
      align-items: start;
      padding: 8px 0;
      font-size: 13px;
      border-bottom: 1px solid #eee;
    }
    .checklist-item:last-child {
      border-bottom: none;
    }
    .check {
      color: ${brandColors.accent};
      font-weight: bold;
      margin-right: 10px;
      font-size: 16px;
    }
    .contact {
      background: ${brandColors.primary};
      color: white;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
    .contact h3 {
      font-size: 16px;
      margin: 0 0 10px 0;
      color: ${brandColors.accent};
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .contact p {
      font-size: 12px;
      margin: 5px 0;
    }
    .qr-section {
      text-align: center;
      margin: 20px 0;
    }
    .qr-placeholder {
      width: 120px;
      height: 120px;
      background: ${brandColors.primary};
      border: 2px dashed ${brandColors.accent};
      margin: 0 auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 9px;
      text-align: center;
      padding: 10px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="hanger">
    <div class="hole"></div>
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">Professional Home Cleaning</div>
    </div>

    <div class="checklist">
      <h3>What's Included:</h3>
      <div class="checklist-item">
        <span class="check">✓</span>
        <span>Dust all surfaces</span>
      </div>
      <div class="checklist-item">
        <span class="check">✓</span>
        <span>Vacuum & mop floors</span>
      </div>
      <div class="checklist-item">
        <span class="check">✓</span>
        <span>Clean & sanitize bathrooms</span>
      </div>
      <div class="checklist-item">
        <span class="check">✓</span>
        <span>Kitchen deep clean</span>
      </div>
      <div class="checklist-item">
        <span class="check">✓</span>
        <span>Trash removal</span>
      </div>
      <div class="checklist-item">
        <span class="check">✓</span>
        <span>Eco-friendly supplies</span>
      </div>
      <div class="checklist-item">
        <span class="check">✓</span>
        <span>Background checked cleaners</span>
      </div>
      <div class="checklist-item">
        <span class="check">✓</span>
        <span>100% satisfaction guarantee</span>
      </div>
    </div>

    <div class="contact">
      <h3>Contact Us</h3>
      <p>Book Online: velocitymaid.com/new-jersey</p>
      <p>Call: (555) 123-4567</p>
    </div>

    <div class="qr-section">
      <div class="qr-placeholder">
        QR Code<br><br>Scan to Book<br><br>velocitymaid.com/new-jersey
      </div>
      <p style="font-size: 11px; color: #666; margin: 0;">Scan for instant booking</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

