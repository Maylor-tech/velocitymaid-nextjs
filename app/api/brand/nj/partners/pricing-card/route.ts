export const dynamic = 'force-dynamic'

/**
 * VelocityMaid New Jersey Pricing Card (PNG)
 * GET /api/brand/nj/partners/pricing-card
 * 
 * Generates pricing card as HTML (printable to PNG)
 */

import { NextRequest, NextResponse } from 'next/server';

const brandColors = {
  primary: '#0A3D2F',
  accent: '#F8C548',
  white: '#FFFFFF',
};

export async function GET(request: NextRequest) {
  try {
    const html = generatePricingCard();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-pricing-card.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate pricing card error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate pricing card' },
      { status: 500 }
    );
  }
}

function generatePricingCard(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Pricing Card</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 800px;
      height: 600px;
      font-family: 'Inter', Arial, sans-serif;
      background: ${brandColors.white};
    }
    .card {
      width: 100%;
      height: 100%;
      padding: 40px;
      background: linear-gradient(135deg, ${brandColors.primary} 0%, #083025 100%);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .logo {
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      font-size: 48px;
      font-weight: bold;
      color: ${brandColors.accent};
      text-align: center;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 20px;
      text-align: center;
      color: rgba(255,255,255,0.9);
      margin-bottom: 40px;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .price-card {
      background: rgba(255,255,255,0.1);
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      border: 2px solid ${brandColors.accent};
    }
    .price-card h3 {
      font-size: 20px;
      margin: 0 0 15px 0;
      color: ${brandColors.accent};
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .price {
      font-size: 42px;
      font-weight: bold;
      margin: 15px 0;
    }
    .footer {
      text-align: center;
      font-size: 16px;
      color: rgba(255,255,255,0.8);
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div>
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <div class="pricing-grid">
      <div class="price-card">
        <h3>Studio/1BR</h3>
        <div class="price">$120</div>
      </div>
      <div class="price-card">
        <h3>2 Bedroom</h3>
        <div class="price">$150</div>
      </div>
      <div class="price-card">
        <h3>3 Bedroom</h3>
        <div class="price">$180</div>
      </div>
    </div>
    <div class="footer">
      <p>Transparent Pricing • No Hidden Fees</p>
      <p>velocitymaid.com/new-jersey</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}


