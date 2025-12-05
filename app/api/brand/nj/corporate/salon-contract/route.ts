export const dynamic = 'force-dynamic'

/**
 * Salon/Barbershop Cleaning Contract PDF
 * GET /api/brand/nj/corporate/salon-contract
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
    const html = generateSalonContract();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-salon-cleaning-contract.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate salon contract error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate salon contract' },
      { status: 500 }
    );
  }
}

function generateSalonContract(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Salon Cleaning Contract</title>
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
    <h1>Salon & Barbershop Cleaning Service Agreement</h1>
    <p style="text-align: center; font-size: 18px; color: #666; margin-top: 40px;">
      This agreement establishes specialized cleaning services for salons and barbershops.
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
      <strong>Client:</strong> [Salon/Barbershop Name]<br>
      <strong>Contact Person:</strong> [Name]<br>
      <strong>Service Address:</strong> [Address]<br>
      <strong>Effective Date:</strong> [Date]
    </p>

    <h2>2. Services Provided</h2>
    <p>VelocityMaid agrees to provide specialized salon/barbershop cleaning services:</p>
    <ul>
      <li>Station sanitization and disinfection</li>
      <li>Tool cleaning area maintenance</li>
      <li>Floor cleaning (hair removal and sanitization)</li>
      <li>Restroom sanitization</li>
      <li>Reception area cleaning</li>
      <li>Mirror and glass cleaning</li>
      <li>Waiting area cleaning</li>
      <li>Trash removal</li>
    </ul>

    <h2>3. Service Schedule</h2>
    <p>
      Cleaning services will be performed: [Frequency - Daily/Weekly]<br>
      Preferred days: [Days]<br>
      Preferred time: [Time - typically after hours]
    </p>

    <h2>4. Pricing and Payment</h2>
    <p>
      <strong>Monthly Rate:</strong> $[Amount]<br>
      <strong>Payment Terms:</strong> Net 15 days<br>
      Pricing based on square footage, number of stations, and frequency.
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
      Salon and barbershop cleaning requires specialized attention to health and safety standards:
    </p>
    <ul>
      <li>Use of hospital-grade disinfectants</li>
      <li>Proper hair removal and disposal</li>
      <li>Sanitization of all surfaces</li>
      <li>Compliance with state health regulations</li>
    </ul>

    <h2>6. Quality Standards</h2>
    <p>
      VelocityMaid maintains high standards for salon cleaning, ensuring compliance with health 
      department regulations and industry best practices.
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
        <p style="font-size: 12px; color: #666; margin: 0;">Client Authorized Signature</p>
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

