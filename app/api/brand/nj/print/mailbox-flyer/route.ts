export const dynamic = 'force-dynamic'

/**
 * VelocityMaid New Jersey Mailbox Flyer Generator
 * GET /api/brand/nj/print/mailbox-flyer
 * 
 * Generates half-page mailbox flyer (5.5x8.5) as HTML (printable to PDF)
 */

import { NextRequest, NextResponse } from 'next/server';

const brandColors = {
  primary: '#0A3D2F',
  accent: '#F8C548',
  white: '#FFFFFF',
};

export async function GET(request: NextRequest) {
  try {
    const html = generateMailboxFlyer();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-mailbox-flyer.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate mailbox flyer error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate flyer' },
      { status: 500 }
    );
  }
}

function generateMailboxFlyer(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Mailbox Flyer</title>
  <style>
    @page {
      size: 5.5in 8.5in;
      margin: 0.25in;
    }
    body {
      margin: 0;
      padding: 0;
      width: 5.5in;
      min-height: 8.5in;
      font-family: 'Inter', Arial, sans-serif;
      background: ${brandColors.primary};
      color: white;
    }
    .flyer {
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
      font-size: 14px;
      text-align: center;
      color: rgba(255,255,255,0.9);
      margin-bottom: 30px;
    }
    .promo-code {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      margin: 30px 0;
    }
    .promo-code h1 {
      font-size: 48px;
      font-weight: bold;
      margin: 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .promo-code p {
      font-size: 18px;
      margin: 10px 0 0 0;
      font-weight: 600;
    }
    .pricing {
      background: rgba(255,255,255,0.1);
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .pricing h3 {
      font-size: 20px;
      margin: 0 0 15px 0;
      text-align: center;
      color: ${brandColors.accent};
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .price-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.2);
    }
    .price-item:last-child {
      border-bottom: none;
    }
    .price {
      font-weight: bold;
      color: ${brandColors.accent};
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
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: rgba(255,255,255,0.8);
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="flyer">
    <div>
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">Professional Home Cleaning</div>
    </div>

    <div class="promo-code">
      <h1>NJ15</h1>
      <p>15% OFF First Clean</p>
    </div>

    <div class="pricing">
      <h3>Flat-Rate Pricing</h3>
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

    <div class="features">
      <div class="feature">
        <span class="check">✓</span>
        <span>Background checked cleaners</span>
      </div>
      <div class="feature">
        <span class="check">✓</span>
        <span>Eco-friendly supplies</span>
      </div>
      <div class="feature">
        <span class="check">✓</span>
        <span>100% satisfaction guarantee</span>
      </div>
      <div class="feature">
        <span class="check">✓</span>
        <span>Insured & bonded</span>
      </div>
    </div>

    <div class="cta">Book Now: velocitymaid.com/new-jersey</div>

    <div class="footer">
      <p>Use code <strong>NJ15</strong> at checkout</p>
      <p>Call: (555) 123-4567</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}


