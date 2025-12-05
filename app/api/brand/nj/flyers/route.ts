export const dynamic = 'force-dynamic';

/**
 * VelocityMaid New Jersey Flyer & Door Hanger Generator
 * GET /api/brand/nj/flyers?type={flyerType}
 * 
 * Generates flyers and door hangers as HTML (printable to PDF/PNG)
 */

import { NextRequest, NextResponse } from 'next/server';

const brandColors = {
  primary: '#0A3D2F',
  accent: '#F8C548',
  accent2: '#2B70C9',
  white: '#FFFFFF',
  neutral: '#F3F1EB',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'flyer';

    const html = generateFlyer(type);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="velocitymaid-nj-${type}.html"`,
      },
    });
  } catch (error: any) {
    console.error('Generate flyer error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate flyer' },
      { status: 500 }
    );
  }
}

function generateFlyer(type: string): string {
  switch (type) {
    case 'flyer':
      return generateNeighborhoodFlyer();
    case 'door-hanger-front':
      return generateDoorHangerFront();
    case 'door-hanger-back':
      return generateDoorHangerBack();
    default:
      return generateNeighborhoodFlyer();
  }
}

function generateNeighborhoodFlyer(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Neighborhood Flyer</title>
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    body {
      font-family: 'Inter', 'Arial', sans-serif;
      margin: 0;
      padding: 0;
      background: white;
    }
    .flyer {
      width: 8.5in;
      min-height: 11in;
      padding: 40px;
      background: white;
      border: 4px solid ${brandColors.accent};
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
      font-size: 48px;
      font-weight: bold;
      color: ${brandColors.accent};
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 24px;
      color: white;
    }
    .promo-box {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin: 30px 0;
    }
    .promo-box h2 {
      font-size: 48px;
      font-weight: bold;
      margin: 0;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .price-card {
      background: ${brandColors.neutral};
      padding: 25px;
      border-radius: 8px;
      border-left: 4px solid ${brandColors.accent};
      text-align: center;
    }
    .price-card h3 {
      color: ${brandColors.primary};
      font-size: 24px;
      margin: 0 0 10px 0;
    }
    .price {
      font-size: 36px;
      font-weight: bold;
      color: ${brandColors.primary};
      margin: 10px 0;
    }
    .features {
      background: ${brandColors.neutral};
      padding: 25px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .features ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .features li {
      padding: 10px 0;
      font-size: 18px;
      border-bottom: 1px solid #ddd;
    }
    .features li:last-child {
      border-bottom: none;
    }
    .contact {
      background: ${brandColors.primary};
      color: white;
      padding: 25px;
      border-radius: 8px;
      text-align: center;
      margin: 30px 0;
    }
    .contact h3 {
      color: ${brandColors.accent};
      font-size: 24px;
      margin: 0 0 15px 0;
    }
    .contact p {
      font-size: 18px;
      margin: 8px 0;
    }
    .qr-placeholder {
      width: 200px;
      height: 200px;
      background: white;
      border: 3px dashed ${brandColors.accent};
      margin: 20px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${brandColors.primary};
      font-size: 14px;
      text-align: center;
      padding: 10px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="flyer">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    
    <div class="promo-box">
      <h2>15% OFF</h2>
      <p style="font-size: 24px; margin: 10px 0;">Your First Cleaning</p>
    </div>

    <h2 style="color: ${brandColors.primary}; font-size: 32px; text-align: center; margin: 30px 0;">
      Professional Cleaning Services
    </h2>

    <div class="pricing-grid">
      <div class="price-card">
        <h3>1 Bedroom</h3>
        <div class="price">$120</div>
        <p>Standard Clean</p>
      </div>
      <div class="price-card">
        <h3>2 Bedroom</h3>
        <div class="price">$150</div>
        <p>Standard Clean</p>
      </div>
      <div class="price-card">
        <h3>3 Bedroom</h3>
        <div class="price">$180</div>
        <p>Standard Clean</p>
      </div>
    </div>

    <div class="features">
      <h3 style="color: ${brandColors.primary}; font-size: 24px; margin-bottom: 15px;">What's Included:</h3>
      <ul>
        <li>✓ Standard Cleaning</li>
        <li>✓ Deep Cleaning Available</li>
        <li>✓ Move In/Out Cleaning</li>
        <li>✓ Recurring Service Discounts</li>
        <li>✓ Insured & Bonded</li>
        <li>✓ Satisfaction Guaranteed</li>
      </ul>
    </div>

    <div class="contact">
      <h3>Contact Us</h3>
      <p><strong>Phone:</strong> (555) 123-4567</p>
      <p><strong>Website:</strong> velocitymaid.com/new-jersey</p>
      <p><strong>Email:</strong> nj@velocitymaid.com</p>
      <div class="qr-placeholder">
        QR Code<br><br>Scan to Book<br><br>velocitymaid.com/new-jersey
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
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
      size: letter;
      margin: 0.25in;
    }
    body {
      font-family: 'Inter', 'Arial', sans-serif;
      margin: 0;
      padding: 0;
      background: white;
    }
    .hanger {
      width: 4in;
      height: 6in;
      padding: 30px;
      background: ${brandColors.primary};
      color: white;
      border-radius: 12px;
      position: relative;
    }
    .hole {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: white;
      border: 3px solid ${brandColors.accent};
    }
    .logo {
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      font-size: 36px;
      font-weight: bold;
      color: ${brandColors.accent};
      text-align: center;
      margin-top: 50px;
      margin-bottom: 20px;
    }
    .subtitle {
      font-size: 18px;
      text-align: center;
      color: white;
      margin-bottom: 30px;
    }
    .promo {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 30px 0;
    }
    .promo h2 {
      font-size: 36px;
      font-weight: bold;
      margin: 0;
    }
    .pricing {
      text-align: center;
      margin: 30px 0;
    }
    .price {
      font-size: 28px;
      font-weight: bold;
      color: ${brandColors.accent};
      margin: 10px 0;
    }
    .cta {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      font-weight: bold;
      font-size: 18px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="hanger">
    <div class="hole"></div>
    <div class="logo">VelocityMaid</div>
    <div class="subtitle">New Jersey</div>
    <div class="promo">
      <h2>15% OFF</h2>
      <p style="font-size: 18px; margin: 10px 0;">First Cleaning</p>
    </div>
    <div class="pricing">
      <p style="font-size: 16px; margin: 0;">Starting at</p>
      <div class="price">$120</div>
      <p style="font-size: 14px; margin: 0;">Professional Cleaning</p>
    </div>
    <div class="cta">Book Now</div>
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
      size: letter;
      margin: 0.25in;
    }
    body {
      font-family: 'Inter', 'Arial', sans-serif;
      margin: 0;
      padding: 0;
      background: white;
    }
    .hanger {
      width: 4in;
      height: 6in;
      padding: 30px;
      background: white;
      border: 3px solid ${brandColors.primary};
      border-radius: 12px;
    }
    .logo {
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      font-size: 28px;
      font-weight: bold;
      color: ${brandColors.primary};
      text-align: center;
      margin-bottom: 20px;
    }
    .contact {
      margin: 20px 0;
    }
    .contact h3 {
      color: ${brandColors.primary};
      font-size: 18px;
      margin: 15px 0 8px 0;
    }
    .contact p {
      font-size: 14px;
      color: #333;
      margin: 5px 0;
    }
    .features {
      margin: 20px 0;
    }
    .features ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .features li {
      padding: 8px 0;
      font-size: 14px;
      color: #333;
      border-bottom: 1px solid #eee;
    }
    .qr-placeholder {
      width: 150px;
      height: 150px;
      background: ${brandColors.neutral};
      border: 2px dashed ${brandColors.primary};
      margin: 20px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${brandColors.primary};
      font-size: 12px;
      text-align: center;
      padding: 10px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="hanger">
    <div class="logo">VelocityMaid New Jersey</div>
    
    <div class="contact">
      <h3>Contact Us</h3>
      <p><strong>Phone:</strong> (555) 123-4567</p>
      <p><strong>Website:</strong> velocitymaid.com/new-jersey</p>
      <p><strong>Email:</strong> nj@velocitymaid.com</p>
    </div>

    <div class="features">
      <h3 style="color: ${brandColors.primary}; font-size: 18px; margin: 15px 0 8px 0;">Services:</h3>
      <ul>
        <li>✓ Standard Cleaning</li>
        <li>✓ Deep Cleaning</li>
        <li>✓ Move In/Out</li>
        <li>✓ Recurring Service</li>
      </ul>
    </div>

    <div class="qr-placeholder">
      QR Code<br><br>Scan to Book<br><br>velocitymaid.com/new-jersey
    </div>
  </div>
</body>
</html>
  `.trim();
}

