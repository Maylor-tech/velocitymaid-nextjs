export const dynamic = 'force-dynamic'

/**
 * VelocityMaid New Jersey Move-Out Cleaning Pricing Sheet
 * GET /api/brand/nj/partners/moveout-pricing
 * 
 * Generates move-out pricing sheet as HTML (printable to PDF)
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
    const html = generateMoveOutPricing();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-moveout-pricing.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate move-out pricing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate pricing sheet' },
      { status: 500 }
    );
  }
}

function generateMoveOutPricing(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Move-Out Cleaning Pricing</title>
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
    .pricing-table tr:hover {
      background: #e8e8e8;
    }
    .price {
      font-weight: bold;
      color: ${brandColors.primary};
      font-size: 18px;
    }
    .partnership-price {
      color: ${brandColors.accent};
      font-weight: bold;
      font-size: 18px;
    }
    .highlight-box {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
      text-align: center;
    }
    .highlight-box h2 {
      color: ${brandColors.primary};
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .features {
      margin: 30px 0;
    }
    .features ul {
      list-style: none;
      padding: 0;
    }
    .features li {
      padding: 10px 0;
      font-size: 15px;
      border-bottom: 1px solid #eee;
    }
    .features li:before {
      content: "✓ ";
      color: ${brandColors.accent};
      font-weight: bold;
      margin-right: 10px;
    }
    .contact {
      background: ${brandColors.gray};
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">VelocityMaid</div>
    <div style="font-size: 18px; color: rgba(255,255,255,0.9);">New Jersey</div>
    <h1 class="title">Move-Out Cleaning Pricing</h1>
    <p style="font-size: 18px; margin: 10px 0 0 0;">Partnership Rates for Apartment Complexes</p>
  </div>

  <div class="highlight-box">
    <h2>Partnership Discount</h2>
    <p style="font-size: 20px; margin: 0; font-weight: 600;">Save up to 15% on all move-out cleanings</p>
  </div>

  <table class="pricing-table">
    <thead>
      <tr>
        <th>Apartment Size</th>
        <th>Standard Rate</th>
        <th>Partnership Rate</th>
        <th>Savings</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Studio/1 Bedroom</strong></td>
        <td class="price">$320</td>
        <td class="partnership-price">$280</td>
        <td>$40 (12.5%)</td>
      </tr>
      <tr>
        <td><strong>2 Bedroom</strong></td>
        <td class="price">$380</td>
        <td class="partnership-price">$330</td>
        <td>$50 (13.2%)</td>
      </tr>
      <tr>
        <td><strong>3 Bedroom</strong></td>
        <td class="price">$450</td>
        <td class="partnership-price">$390</td>
        <td>$60 (13.3%)</td>
      </tr>
      <tr>
        <td><strong>4+ Bedroom</strong></td>
        <td class="price">Custom Quote</td>
        <td class="partnership-price">15% Discount</td>
        <td>Applied</td>
      </tr>
    </tbody>
  </table>

  <div class="features">
    <h2 style="color: ${brandColors.primary}; font-size: 24px; margin: 0 0 20px 0; font-family: 'Montserrat', 'Poppins', Arial, sans-serif;">
      What's Included in Move-Out Cleaning:
    </h2>
    <ul>
      <li>Complete deep cleaning of all rooms</li>
      <li>Inside all cabinets, drawers, and closets</li>
      <li>Appliance deep clean (oven, refrigerator, dishwasher, microwave)</li>
      <li>Bathroom sanitization (toilet, shower, tub, sink, mirrors)</li>
      <li>Window cleaning (interior)</li>
      <li>Baseboards and window sills</li>
      <li>Light fixtures and ceiling fans</li>
      <li>Wall spot cleaning</li>
      <li>Floor vacuuming and mopping</li>
      <li>Final inspection and quality check</li>
      <li>Photo documentation (optional)</li>
    </ul>
  </div>

  <div class="highlight-box">
    <h2>Volume Discounts Available</h2>
    <p style="font-size: 18px; margin: 10px 0;">Properties with 50+ units or guaranteed monthly volume receive additional discounts.</p>
    <p style="font-size: 16px; margin: 10px 0 0 0;">Contact us for custom pricing based on your property size.</p>
  </div>

  <div class="contact">
    <h3 style="color: ${brandColors.primary}; font-size: 20px; margin: 0 0 15px 0; font-family: 'Montserrat', 'Poppins', Arial, sans-serif;">
      Ready to Partner?
    </h3>
    <p style="font-size: 16px; margin: 5px 0;"><strong>Email:</strong> partners@velocitymaid.com</p>
    <p style="font-size: 16px; margin: 5px 0;"><strong>Phone:</strong> (555) 123-4567</p>
    <p style="font-size: 16px; margin: 5px 0;"><strong>Website:</strong> velocitymaid.com/partners/apartments</p>
  </div>
</body>
</html>
  `.trim();
}

