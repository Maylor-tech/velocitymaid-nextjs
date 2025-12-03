/**
 * Restaurant Nightly Clean Contract PDF
 * GET /api/brand/nj/corporate/restaurant-contract
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
    const html = generateRestaurantContract();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-restaurant-cleaning-contract.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate restaurant contract error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate restaurant contract' },
      { status: 500 }
    );
  }
}

function generateRestaurantContract(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Restaurant Cleaning Contract</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }
    body {
      font-family: 'Inter', Arial, sans-serif;
      color: #333;
      line-height: 1.8;
      margin: 0;
      padding: 0;
    }
    .page {
      page-break-after: always;
      min-height: 9.5in;
      padding: 20px 0;
    }
    .page:last-child {
      page-break-after: auto;
    }
    .header {
      border-bottom: 4px solid ${brandColors.accent};
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 36px;
      font-weight: bold;
      color: ${brandColors.primary};
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .subtitle {
      font-size: 18px;
      color: #2B70C9;
      font-weight: 600;
      margin-top: 5px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 2px solid ${brandColors.gray};
      text-align: center;
      font-size: 11px;
      color: #6B7280;
    }
    h1 {
      font-size: 32px;
      font-weight: bold;
      color: ${brandColors.primary};
      margin: 20px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      text-align: center;
    }
    h2 {
      font-size: 24px;
      font-weight: bold;
      color: ${brandColors.primary};
      margin: 25px 0 15px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      border-bottom: 2px solid ${brandColors.gray};
      padding-bottom: 8px;
    }
    p {
      font-size: 14px;
      line-height: 1.8;
      margin: 12px 0;
      color: #333;
    }
    ul {
      font-size: 14px;
      line-height: 1.8;
      margin: 12px 0;
      padding-left: 25px;
    }
    li {
      margin: 8px 0;
      color: #333;
    }
    .signature-section {
      margin: 40px 0;
      padding: 20px;
      border: 2px solid ${brandColors.gray};
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
  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h1>Restaurant Nightly Cleaning Service Agreement</h1>
    <p style="text-align: center; font-size: 18px; color: #666; margin-top: 40px;">
      This agreement establishes after-hours cleaning services for restaurants.
    </p>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h2>1. Parties</h2>
    <p>
      <strong>Service Provider:</strong> VelocityMaid New Jersey<br>
      <strong>Client:</strong> [Restaurant Name]<br>
      <strong>Contact Person:</strong> [Name]<br>
      <strong>Service Address:</strong> [Address]<br>
      <strong>Effective Date:</strong> [Date]
    </p>

    <h2>2. Services Provided</h2>
    <p>VelocityMaid agrees to provide nightly restaurant cleaning services:</p>
    <ul>
      <li>Kitchen deep cleaning (after close)</li>
      <li>Dining area cleaning</li>
      <li>Restroom sanitization</li>
      <li>Floor scrubbing and mopping</li>
      <li>Equipment exterior cleaning</li>
      <li>Grease trap area maintenance</li>
      <li>Trash removal</li>
      <li>Table and chair sanitization</li>
    </ul>

    <h2>3. Service Schedule</h2>
    <p>
      Cleaning services will be performed: [Frequency - Nightly/Weekly]<br>
      Service time: After restaurant closing (typically 10 PM - 2 AM)<br>
      Days: [Days of week]
    </p>

    <h2>4. Pricing and Payment</h2>
    <p>
      <strong>Monthly Rate:</strong> $[Amount]<br>
      <strong>Payment Terms:</strong> Net 15 days<br>
      Pricing based on square footage, kitchen size, and frequency.
    </p>

    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h2>5. Special Requirements</h2>
    <p>
      Restaurant cleaning requires compliance with health department regulations:
    </p>
    <ul>
      <li>Food-safe cleaning products only</li>
      <li>Proper sanitization procedures</li>
      <li>Grease removal and maintenance</li>
      <li>Compliance with health inspection standards</li>
    </ul>

    <h2>6. Quality Standards</h2>
    <p>
      VelocityMaid maintains high standards for restaurant cleaning, ensuring compliance with 
      health department regulations and food safety requirements.
    </p>

    <h2>7. Term and Termination</h2>
    <p>
      This agreement shall commence on the Effective Date and continue for an initial term of 
      [12 months], unless terminated earlier. Either party may terminate with 30 days written notice.
    </p>

    <div class="signature-section">
      <h2>Signatures</h2>
      <div style="margin-top: 40px;">
        <div class="signature-line"></div>
        <p style="font-size: 12px; color: #666; margin: 0;">VelocityMaid Authorized Signature</p>
      </div>
      <div style="margin-top: 40px;">
        <div class="signature-line"></div>
        <p style="font-size: 12px; color: #666; margin: 0;">Restaurant Authorized Signature</p>
      </div>
    </div>

    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

