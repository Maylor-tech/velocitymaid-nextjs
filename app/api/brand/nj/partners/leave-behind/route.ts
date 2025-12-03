/**
 * VelocityMaid New Jersey Leave-Behind Card Generator
 * GET /api/brand/nj/partners/leave-behind?side={front|back}
 * 
 * Generates leave-behind card as HTML (printable to PDF/PNG)
 * Size: 4in x 6in (postcard size)
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
    const { searchParams } = new URL(request.url);
    const side = searchParams.get('side') || 'front';

    const html = side === 'front' ? generateLeaveBehindFront() : generateLeaveBehindBack();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="velocitymaid-nj-leave-behind-${side}.html"`,
      },
    });
  } catch (error: any) {
    console.error('Generate leave-behind error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate leave-behind card' },
      { status: 500 }
    );
  }
}

function generateLeaveBehindFront(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Leave-Behind Card Front</title>
  <style>
    @page {
      size: 4in 6in;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      width: 4in;
      height: 6in;
      font-family: 'Inter', Arial, sans-serif;
      background: ${brandColors.primary};
      color: white;
    }
    .card {
      width: 100%;
      height: 100%;
      padding: 0.4in;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .logo {
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      font-size: 36px;
      font-weight: bold;
      color: ${brandColors.accent};
      text-align: center;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 16px;
      text-align: center;
      color: rgba(255,255,255,0.9);
      margin-bottom: 30px;
    }
    .promo {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      margin: 20px 0;
    }
    .promo h1 {
      font-size: 42px;
      font-weight: bold;
      margin: 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .promo p {
      font-size: 18px;
      margin: 10px 0 0 0;
      font-weight: 600;
    }
    .features {
      margin: 20px 0;
    }
    .feature {
      display: flex;
      align-items: center;
      padding: 8px 0;
      font-size: 14px;
    }
    .check {
      color: ${brandColors.accent};
      font-weight: bold;
      margin-right: 10px;
      font-size: 18px;
    }
    .cta {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      font-weight: bold;
      font-size: 18px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div>
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">Professional Home Cleaning</div>
    </div>

    <div class="promo">
      <h1>15% OFF</h1>
      <p>First Clean</p>
    </div>

    <div class="features">
      <div class="feature">
        <span class="check">✓</span>
        <span>Background checked cleaners</span>
      </div>
      <div class="feature">
        <span class="check">✓</span>
        <span>Flat-rate pricing</span>
      </div>
      <div class="feature">
        <span class="check">✓</span>
        <span>Eco-friendly supplies</span>
      </div>
      <div class="feature">
        <span class="check">✓</span>
        <span>100% satisfaction guarantee</span>
      </div>
    </div>

    <div class="cta">Book Now</div>
  </div>
</body>
</html>
  `.trim();
}

function generateLeaveBehindBack(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Leave-Behind Card Back</title>
  <style>
    @page {
      size: 4in 6in;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      width: 4in;
      height: 6in;
      font-family: 'Inter', Arial, sans-serif;
      background: white;
      color: ${brandColors.primary};
    }
    .card {
      width: 100%;
      height: 100%;
      padding: 0.4in;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .logo {
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      font-size: 32px;
      font-weight: bold;
      color: ${brandColors.primary};
      text-align: center;
      margin-bottom: 20px;
    }
    .pricing {
      margin: 20px 0;
    }
    .pricing h3 {
      font-size: 20px;
      margin: 0 0 15px 0;
      color: ${brandColors.primary};
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .price-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 16px;
      border-bottom: 1px solid #eee;
    }
    .price-item:last-child {
      border-bottom: none;
    }
    .price {
      font-weight: bold;
      color: ${brandColors.accent};
    }
    .contact {
      background: ${brandColors.primary};
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .contact h3 {
      color: ${brandColors.accent};
      margin: 0 0 15px 0;
      font-size: 18px;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .contact p {
      font-size: 14px;
      margin: 5px 0;
      color: white;
    }
    .qr-placeholder {
      width: 150px;
      height: 150px;
      background: ${brandColors.gray};
      border: 2px dashed ${brandColors.primary};
      margin: 15px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${brandColors.primary};
      font-size: 10px;
      text-align: center;
      padding: 10px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div>
      <div class="logo">VelocityMaid New Jersey</div>
    </div>

    <div class="pricing">
      <h3>Transparent Pricing</h3>
      <div class="price-item">
        <span>Studio/1BR</span>
        <span class="price">$120</span>
      </div>
      <div class="price-item">
        <span>2 Bedroom</span>
        <span class="price">$150</span>
      </div>
      <div class="price-item">
        <span>3 Bedroom</span>
        <span class="price">$180</span>
      </div>
    </div>

    <div class="contact">
      <h3>Contact Us</h3>
      <p><strong>Book Online:</strong></p>
      <p>velocitymaid.com/new-jersey</p>
      <p><strong>Call:</strong> (555) 123-4567</p>
      <div class="qr-placeholder">
        QR Code<br><br>Scan to Book<br><br>velocitymaid.com/new-jersey
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

