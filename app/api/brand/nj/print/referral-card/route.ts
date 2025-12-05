export const dynamic = 'force-dynamic';

/**
 * VelocityMaid New Jersey Referral Card Generator
 * GET /api/brand/nj/print/referral-card?side={front|back}
 * 
 * Generates referral card as HTML (printable to PDF)
 * Size: 3.5in x 2in
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

    const html = side === 'front' ? generateReferralCardFront() : generateReferralCardBack();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="velocitymaid-nj-referral-card-${side}.html"`,
      },
    });
  } catch (error: any) {
    console.error('Generate referral card error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate referral card' },
      { status: 500 }
    );
  }
}

function generateReferralCardFront(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Referral Card Front</title>
  <style>
    @page {
      size: 3.5in 2in;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      width: 3.5in;
      height: 2in;
      font-family: 'Inter', Arial, sans-serif;
      background: ${brandColors.primary};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      width: 100%;
      height: 100%;
      padding: 0.2in;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .logo {
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      font-size: 28px;
      font-weight: bold;
      color: ${brandColors.accent};
      margin-bottom: 5px;
    }
    .subtitle {
      font-size: 12px;
      color: rgba(255,255,255,0.9);
      margin-bottom: 10px;
    }
    .tagline {
      font-size: 11px;
      color: rgba(255,255,255,0.8);
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">VelocityMaid</div>
    <div class="subtitle">New Jersey</div>
    <div class="tagline">Professional Home Cleaning</div>
  </div>
</body>
</html>
  `.trim();
}

function generateReferralCardBack(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Referral Card Back</title>
  <style>
    @page {
      size: 3.5in 2in;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      width: 3.5in;
      height: 2in;
      font-family: 'Inter', Arial, sans-serif;
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      width: 100%;
      height: 100%;
      padding: 0.2in;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .promo {
      font-size: 24px;
      font-weight: bold;
      margin: 5px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .promo-subtitle {
      font-size: 14px;
      margin: 5px 0;
      font-weight: 600;
    }
    .qr-placeholder {
      width: 80px;
      height: 80px;
      background: white;
      border: 2px dashed ${brandColors.primary};
      margin: 10px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${brandColors.primary};
      font-size: 8px;
      text-align: center;
      padding: 5px;
      border-radius: 4px;
    }
    .website {
      font-size: 10px;
      margin-top: 8px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="promo">Give $20, Get $20</div>
    <div class="promo-subtitle">Referral Bonus</div>
    <div class="qr-placeholder">
      QR<br>Code
    </div>
    <div class="website">velocitymaid.com/new-jersey</div>
  </div>
</body>
</html>
  `.trim();
}

