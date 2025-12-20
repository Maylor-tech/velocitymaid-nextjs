export const dynamic = 'force-dynamic'

/**
 * VelocityMaid New Jersey Lobby Flyer Generator
 * GET /api/brand/nj/print/lobby-flyer
 * 
 * Generates 8.5x11 lobby flyer as HTML (printable to PDF)
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
    const html = generateLobbyFlyer();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-lobby-flyer.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate lobby flyer error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate flyer' },
      { status: 500 }
    );
  }
}

function generateLobbyFlyer(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Lobby Flyer</title>
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
    .flyer {
      width: 8.5in;
      min-height: 11in;
      padding: 0.5in;
      background: white;
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
    .title {
      font-size: 32px;
      font-weight: bold;
      margin: 20px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .subtitle {
      font-size: 20px;
      color: rgba(255,255,255,0.9);
    }
    .services {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .service-card {
      background: ${brandColors.gray};
      padding: 25px;
      border-radius: 8px;
      border-left: 4px solid ${brandColors.accent};
    }
    .service-card h3 {
      font-size: 22px;
      color: ${brandColors.primary};
      margin: 0 0 15px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .service-card ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .service-card li {
      padding: 8px 0;
      font-size: 14px;
      border-bottom: 1px solid #ddd;
    }
    .service-card li:last-child {
      border-bottom: none;
    }
    .service-card li:before {
      content: "✓ ";
      color: ${brandColors.accent};
      font-weight: bold;
      margin-right: 8px;
    }
    .benefits {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 30px 0;
    }
    .benefit {
      text-align: center;
      padding: 20px;
      background: white;
      border: 2px solid ${brandColors.primary};
      border-radius: 8px;
    }
    .benefit-icon {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .benefit h4 {
      font-size: 16px;
      color: ${brandColors.primary};
      margin: 10px 0 5px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .benefit p {
      font-size: 12px;
      color: #666;
      margin: 0;
    }
    .cta-block {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      margin: 30px 0;
    }
    .cta-block h2 {
      font-size: 36px;
      font-weight: bold;
      margin: 0 0 15px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .cta-block p {
      font-size: 18px;
      margin: 10px 0;
    }
    .qr-section {
      text-align: center;
      margin: 20px 0;
    }
    .qr-placeholder {
      width: 200px;
      height: 200px;
      background: white;
      border: 3px dashed ${brandColors.primary};
      margin: 0 auto 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${brandColors.primary};
      font-size: 12px;
      text-align: center;
      padding: 10px;
      border-radius: 8px;
    }
    .contact {
      text-align: center;
      margin: 30px 0;
      padding: 20px;
      background: ${brandColors.gray};
      border-radius: 8px;
    }
    .contact p {
      font-size: 16px;
      margin: 5px 0;
      color: ${brandColors.primary};
    }
  </style>
</head>
<body>
  <div class="flyer">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
      <h1 class="title">Weekly & Biweekly Cleaning<br>for New Jersey Residents</h1>
    </div>

    <div class="services">
      <div class="service-card">
        <h3>Basic Cleaning</h3>
        <ul>
          <li>Dust all surfaces</li>
          <li>Vacuum & mop floors</li>
          <li>Clean bathrooms</li>
          <li>Kitchen cleaning</li>
          <li>Trash removal</li>
        </ul>
        <p style="font-size: 24px; font-weight: bold; color: ${brandColors.primary}; margin-top: 15px;">From $120</p>
      </div>
      <div class="service-card">
        <h3>Deep Cleaning</h3>
        <ul>
          <li>Everything in Basic</li>
          <li>Inside appliances</li>
          <li>Baseboards & sills</li>
          <li>Light fixtures</li>
          <li>Cabinet interiors</li>
        </ul>
        <p style="font-size: 24px; font-weight: bold; color: ${brandColors.primary}; margin-top: 15px;">From $220</p>
      </div>
    </div>

    <div class="benefits">
      <div class="benefit">
        <div class="benefit-icon">🛡️</div>
        <h4>Background Checked</h4>
        <p>All cleaners verified</p>
      </div>
      <div class="benefit">
        <div class="benefit-icon">💰</div>
        <h4>Flat-Rate Pricing</h4>
        <p>No hidden fees</p>
      </div>
      <div class="benefit">
        <div class="benefit-icon">🌿</div>
        <h4>Eco-Friendly</h4>
        <p>Safe products</p>
      </div>
      <div class="benefit">
        <div class="benefit-icon">⏰</div>
        <h4>On Time</h4>
        <p>Reliable service</p>
      </div>
      <div class="benefit">
        <div class="benefit-icon">⭐</div>
        <h4>100% Guarantee</h4>
        <p>Satisfaction assured</p>
      </div>
      <div class="benefit">
        <div class="benefit-icon">📱</div>
        <h4>Easy Booking</h4>
        <p>Online scheduling</p>
      </div>
    </div>

    <div class="cta-block">
      <h2>Get 15% OFF Your First Clean!</h2>
      <p>New customers only. Limited time offer.</p>
      <div class="qr-section">
        <div class="qr-placeholder">
          QR Code<br><br>Scan to Book<br><br>velocitymaid.com/new-jersey
        </div>
        <p style="font-size: 16px; font-weight: bold; margin: 0;">Scan to book online</p>
      </div>
    </div>

    <div class="contact">
      <p><strong>Book Now:</strong> velocitymaid.com/new-jersey</p>
      <p><strong>Call:</strong> (555) 123-4567</p>
      <p>Serving Newark, Jersey City, Elizabeth, Union, Hoboken & More</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}


