export const dynamic = 'force-dynamic'

/**
 * Corporate Pricing Sheet PDF
 * GET /api/brand/nj/corporate/pricing-sheet
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
    const html = generatePricingSheet();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-corporate-pricing-sheet.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate pricing sheet error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate pricing sheet' },
      { status: 500 }
    );
  }
}

function generatePricingSheet(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Corporate Pricing Sheet</title>
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    body {
      font-family: 'Inter', Arial, sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 0;
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
      font-size: 42px;
      font-weight: bold;
      color: ${brandColors.accent};
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      margin-bottom: 10px;
    }
    .title {
      font-size: 32px;
      font-weight: bold;
      margin: 15px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .pricing-table th {
      background: ${brandColors.primary};
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: bold;
      font-size: 16px;
    }
    .pricing-table td {
      padding: 15px;
      border-bottom: 1px solid #ddd;
      font-size: 15px;
    }
    .pricing-table tr:nth-child(even) {
      background: ${brandColors.gray};
    }
    .price {
      font-weight: bold;
      color: ${brandColors.primary};
      font-size: 18px;
    }
    .note {
      background: ${brandColors.gray};
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
      border-left: 4px solid ${brandColors.accent};
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">VelocityMaid</div>
    <div style="font-size: 18px; color: rgba(255,255,255,0.9);">New Jersey</div>
    <h1 class="title">Corporate Cleaning Pricing</h1>
    <p style="font-size: 18px; margin: 10px 0 0 0;">Transparent pricing for commercial cleaning services</p>
  </div>

  <h2 style="color: ${brandColors.primary}; font-size: 24px; margin: 0 0 20px 0; font-family: 'Montserrat', 'Poppins', Arial, sans-serif;">
    Office Cleaning Pricing
  </h2>
  <table class="pricing-table">
    <thead>
      <tr>
        <th>Square Footage</th>
        <th>Weekly</th>
        <th>Bi-Weekly</th>
        <th>Monthly</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Up to 1,000 sq ft</strong></td>
        <td class="price">$200</td>
        <td class="price">$150</td>
        <td class="price">$600</td>
      </tr>
      <tr>
        <td><strong>1,001 - 2,500 sq ft</strong></td>
        <td class="price">$400</td>
        <td class="price">$300</td>
        <td class="price">$1,200</td>
      </tr>
      <tr>
        <td><strong>2,501 - 5,000 sq ft</strong></td>
        <td class="price">$750</td>
        <td class="price">$550</td>
        <td class="price">$2,200</td>
      </tr>
      <tr>
        <td><strong>5,001 - 10,000 sq ft</strong></td>
        <td class="price">$1,400</td>
        <td class="price">$1,000</td>
        <td class="price">$4,000</td>
      </tr>
      <tr>
        <td><strong>10,000+ sq ft</strong></td>
        <td class="price">Custom Quote</td>
        <td class="price">Custom Quote</td>
        <td class="price">Custom Quote</td>
      </tr>
    </tbody>
  </table>

  <h2 style="color: ${brandColors.primary}; font-size: 24px; margin: 40px 0 20px 0; font-family: 'Montserrat', 'Poppins', Arial, sans-serif;">
    Salon & Barbershop Pricing
  </h2>
  <table class="pricing-table">
    <thead>
      <tr>
        <th>Number of Stations</th>
        <th>Weekly</th>
        <th>Bi-Weekly</th>
        <th>Monthly</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1-3 Stations</strong></td>
        <td class="price">$180</td>
        <td class="price">$130</td>
        <td class="price">$520</td>
      </tr>
      <tr>
        <td><strong>4-6 Stations</strong></td>
        <td class="price">$320</td>
        <td class="price">$240</td>
        <td class="price">$960</td>
      </tr>
      <tr>
        <td><strong>7-10 Stations</strong></td>
        <td class="price">$500</td>
        <td class="price">$375</td>
        <td class="price">$1,500</td>
      </tr>
      <tr>
        <td><strong>10+ Stations</strong></td>
        <td class="price">Custom Quote</td>
        <td class="price">Custom Quote</td>
        <td class="price">Custom Quote</td>
      </tr>
    </tbody>
  </table>

  <h2 style="color: ${brandColors.primary}; font-size: 24px; margin: 40px 0 20px 0; font-family: 'Montserrat', 'Poppins', Arial, sans-serif;">
    Restaurant Nightly Cleaning Pricing
  </h2>
  <table class="pricing-table">
    <thead>
      <tr>
        <th>Restaurant Size</th>
        <th>Nightly</th>
        <th>5x/Week</th>
        <th>Monthly</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Small (up to 1,500 sq ft)</strong></td>
        <td class="price">$250</td>
        <td class="price">$1,000</td>
        <td class="price">$4,000</td>
      </tr>
      <tr>
        <td><strong>Medium (1,501 - 3,000 sq ft)</strong></td>
        <td class="price">$400</td>
        <td class="price">$1,600</td>
        <td class="price">$6,400</td>
      </tr>
      <tr>
        <td><strong>Large (3,001 - 5,000 sq ft)</strong></td>
        <td class="price">$600</td>
        <td class="price">$2,400</td>
        <td class="price">$9,600</td>
      </tr>
      <tr>
        <td><strong>5,000+ sq ft</strong></td>
        <td class="price">Custom Quote</td>
        <td class="price">Custom Quote</td>
        <td class="price">Custom Quote</td>
      </tr>
    </tbody>
  </table>

  <div class="note">
    <p style="margin: 0; font-weight: bold; color: ${brandColors.primary}; margin-bottom: 10px;">
      Pricing Notes:
    </p>
    <ul style="margin: 0; padding-left: 20px;">
      <li>All prices are base rates and may vary based on specific requirements</li>
      <li>Additional services (window cleaning, deep cleaning) available at extra cost</li>
      <li>Volume discounts available for multiple locations</li>
      <li>Annual contracts receive 10% discount</li>
      <li>All prices in USD</li>
    </ul>
  </div>

  <div style="text-align: center; margin: 40px 0;">
    <p style="font-size: 18px; color: ${brandColors.primary}; font-weight: bold;">
      Contact us for a custom quote tailored to your business needs
    </p>
    <p style="font-size: 16px; color: #666;">
      Email: corporate@velocitymaid.com | Phone: (555) 123-4567
    </p>
  </div>
</body>
</html>
  `.trim();
}

