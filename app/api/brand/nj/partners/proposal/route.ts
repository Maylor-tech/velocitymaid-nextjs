/**
 * VelocityMaid New Jersey Apartment Cleaning Partnership Proposal
 * GET /api/brand/nj/partners/proposal
 * 
 * Generates partnership proposal as HTML (printable to PDF)
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
    const html = generateProposal();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-partnership-proposal.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate proposal error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate proposal' },
      { status: 500 }
    );
  }
}

function generateProposal(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Apartment Cleaning Partnership Proposal</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }
    body {
      font-family: 'Inter', Arial, sans-serif;
      color: #333;
      line-height: 1.6;
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
    h3 {
      font-size: 18px;
      font-weight: bold;
      color: ${brandColors.primary};
      margin: 20px 0 10px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    p {
      font-size: 14px;
      line-height: 1.8;
      margin: 12px 0;
      color: #333;
    }
    ul, ol {
      font-size: 14px;
      line-height: 1.8;
      margin: 12px 0;
      padding-left: 25px;
    }
    li {
      margin: 8px 0;
      color: #333;
    }
    .highlight-box {
      background: ${brandColors.gray};
      border-left: 4px solid ${brandColors.accent};
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .benefit-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .benefit-card {
      background: white;
      border: 2px solid ${brandColors.primary};
      padding: 20px;
      border-radius: 8px;
    }
    .benefit-card h3 {
      color: ${brandColors.accent};
      margin: 0 0 10px 0;
    }
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .pricing-table th {
      background: ${brandColors.primary};
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    .pricing-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #ddd;
    }
    .pricing-table tr:nth-child(even) {
      background: ${brandColors.gray};
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h1 style="text-align: center; font-size: 48px; margin-top: 100px;">
      Apartment Cleaning Partnership Proposal
    </h1>
    <p style="text-align: center; font-size: 24px; color: #666; margin-top: 30px;">
      Professional Cleaning Services for<br>
      Apartment Complexes & Property Management Companies
    </p>
    <p style="text-align: center; font-size: 18px; color: #666; margin-top: 60px;">
      VelocityMaid New Jersey<br>
      Professional • Reliable • Trusted
    </p>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Introduction -->
  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h1>Partnership Opportunity</h1>
    <p>
      VelocityMaid New Jersey is seeking strategic partnerships with apartment complexes and property 
      management companies throughout New Jersey. We offer professional, reliable cleaning services 
      that enhance resident satisfaction and streamline property operations.
    </p>
    <h2>Why Partner With VelocityMaid?</h2>
    <p>
      As a property manager or apartment complex owner, you understand the importance of maintaining 
      clean, well-kept properties. Our partnership program is designed to:
    </p>
    <ul>
      <li>Enhance resident satisfaction with professional cleaning services</li>
      <li>Streamline move-in and move-out processes</li>
      <li>Provide reliable, background-checked cleaning professionals</li>
      <li>Offer competitive pricing with volume discounts</li>
      <li>Reduce property management workload</li>
      <li>Increase property value through maintained cleanliness</li>
    </ul>
    <div class="highlight-box">
      <p style="margin: 0;"><strong>Our Commitment:</strong> We provide professional, insured, and 
      background-checked cleaners who deliver consistent, high-quality results for your residents.</p>
    </div>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Services Offered -->
  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h1>Services for Apartment Complexes</h1>
    <h2>Move-In Cleaning</h2>
    <p>
      Ensure every new resident moves into a spotless apartment. Our move-in cleaning service includes:
    </p>
    <ul>
      <li>Complete deep cleaning of all rooms</li>
      <li>Inside all cabinets and drawers</li>
      <li>Appliance deep clean (oven, refrigerator, dishwasher)</li>
      <li>Bathroom sanitization</li>
      <li>Window cleaning (interior)</li>
      <li>Final inspection and quality check</li>
    </ul>
    <h2>Move-Out Cleaning</h2>
    <p>
      Prepare apartments for the next resident quickly and efficiently:
    </p>
    <ul>
      <li>Comprehensive deep cleaning</li>
      <li>Damage assessment and reporting</li>
      <li>Inventory check</li>
      <li>Photo documentation</li>
      <li>Fast turnaround (typically same-day)</li>
    </ul>
    <h2>Recurring Cleaning</h2>
    <p>
      Offer residents weekly, bi-weekly, or monthly cleaning services:
    </p>
    <ul>
      <li>Standard apartment cleaning</li>
      <li>Deep cleaning options</li>
      <li>Flexible scheduling</li>
      <li>Volume discounts for residents</li>
    </ul>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Benefits -->
  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h1>Partnership Benefits</h1>
    <div class="benefit-grid">
      <div class="benefit-card">
        <h3>Enhanced Resident Satisfaction</h3>
        <p>Professional cleaning services increase resident satisfaction and retention rates. Happy residents mean fewer complaints and higher renewal rates.</p>
      </div>
      <div class="benefit-card">
        <h3>Streamlined Operations</h3>
        <p>Reduce your workload by outsourcing cleaning services. We handle scheduling, quality control, and customer service.</p>
      </div>
      <div class="benefit-card">
        <h3>Fast Turnaround</h3>
        <p>Quick move-out cleaning means faster apartment turnover and reduced vacancy time, maximizing your rental income.</p>
      </div>
      <div class="benefit-card">
        <h3>Professional Standards</h3>
        <p>All cleaners are background-checked, insured, and trained to meet our high-quality standards. You can trust us with your properties.</p>
      </div>
      <div class="benefit-card">
        <h3>Volume Discounts</h3>
        <p>Partnership pricing provides significant savings compared to individual bookings. The more units, the better the rate.</p>
      </div>
      <div class="benefit-card">
        <h3>Dedicated Account Manager</h3>
        <p>Your property gets a dedicated account manager who understands your needs and ensures consistent service quality.</p>
      </div>
    </div>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Pricing -->
  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h1>Partnership Pricing</h1>
    <p>
      We offer competitive partnership pricing based on volume and commitment level. All prices are 
      flat-rate with no hidden fees.
    </p>
    <h2>Move-In/Move-Out Cleaning</h2>
    <table class="pricing-table">
      <thead>
        <tr>
          <th>Apartment Size</th>
          <th>Standard Rate</th>
          <th>Partnership Rate</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Studio/1BR</td>
          <td>$320</td>
          <td>$280</td>
        </tr>
        <tr>
          <td>2 Bedroom</td>
          <td>$380</td>
          <td>$330</td>
        </tr>
        <tr>
          <td>3 Bedroom</td>
          <td>$450</td>
          <td>$390</td>
        </tr>
        <tr>
          <td>4+ Bedroom</td>
          <td>Quote</td>
          <td>Quote</td>
        </tr>
      </tbody>
    </table>
    <h2>Recurring Cleaning</h2>
    <table class="pricing-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Standard Rate</th>
          <th>Partnership Rate</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Basic Cleaning (1BR)</td>
          <td>$120</td>
          <td>$105</td>
        </tr>
        <tr>
          <td>Basic Cleaning (2BR)</td>
          <td>$150</td>
          <td>$130</td>
        </tr>
        <tr>
          <td>Basic Cleaning (3BR)</td>
          <td>$180</td>
          <td>$155</td>
        </tr>
        <tr>
          <td>Deep Cleaning</td>
          <td>Quote</td>
          <td>15% Discount</td>
        </tr>
      </tbody>
    </table>
    <div class="highlight-box">
      <p style="margin: 0;"><strong>Volume Discounts:</strong> Additional discounts available for 
      properties with 50+ units or guaranteed monthly volume. Contact us for custom pricing.</p>
    </div>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Next Steps -->
  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h1>Next Steps</h1>
    <h2>Getting Started</h2>
    <p>
      Starting a partnership with VelocityMaid is simple:
    </p>
    <ol>
      <li><strong>Initial Consultation:</strong> We'll meet to discuss your property's specific needs and requirements.</li>
      <li><strong>Custom Proposal:</strong> We'll create a tailored proposal based on your property size and cleaning needs.</li>
      <li><strong>Pilot Program:</strong> Start with a trial period to ensure our services meet your standards.</li>
      <li><strong>Partnership Agreement:</strong> Once satisfied, we'll formalize the partnership with a contract.</li>
      <li><strong>Ongoing Support:</strong> Your dedicated account manager will ensure consistent service quality.</li>
    </ol>
    <h2>Contact Information</h2>
    <div class="highlight-box">
      <p style="margin: 0; font-size: 16px;">
        <strong>VelocityMaid New Jersey</strong><br>
        Email: partners@velocitymaid.com<br>
        Phone: (555) 123-4567<br>
        Website: velocitymaid.com/partners/apartments<br>
        Serving: Newark, Jersey City, Elizabeth, Union, Hoboken & More
      </p>
    </div>
    <h2>Why Choose VelocityMaid?</h2>
    <ul>
      <li>✓ Background-checked, insured cleaners</li>
      <li>✓ 100% satisfaction guarantee</li>
      <li>✓ Fast, reliable service</li>
      <li>✓ Competitive partnership pricing</li>
      <li>✓ Dedicated account management</li>
      <li>✓ Flexible scheduling</li>
      <li>✓ Eco-friendly cleaning supplies</li>
    </ul>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

