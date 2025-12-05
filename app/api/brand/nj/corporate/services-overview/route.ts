export const dynamic = 'force-dynamic'

/**
 * Corporate Services Overview PDF
 * GET /api/brand/nj/corporate/services-overview
 * 
 * Generates corporate services overview as HTML (printable to PDF)
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
    const html = generateServicesOverview();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-corporate-services-overview.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate services overview error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate services overview' },
      { status: 500 }
    );
  }
}

function generateServicesOverview(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Corporate Services Overview</title>
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
    .service-card {
      background: ${brandColors.gray};
      border-left: 4px solid ${brandColors.accent};
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .service-card h3 {
      color: ${brandColors.accent};
      margin: 0 0 10px 0;
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
      Corporate Cleaning Services
    </h1>
    <p style="text-align: center; font-size: 24px; color: #666; margin-top: 30px;">
      Professional Commercial Cleaning Solutions<br>
      for New Jersey Businesses
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
    <h1>Why Choose VelocityMaid for Your Business?</h1>
    <p>
      VelocityMaid New Jersey provides professional commercial cleaning services tailored to 
      meet the unique needs of businesses across New Jersey. From offices to salons to 
      restaurants, we deliver consistent, high-quality cleaning that keeps your business 
      looking its best.
    </p>
    <h2>Our Commitment</h2>
    <ul>
      <li>Background-checked, insured cleaning professionals</li>
      <li>Consistent, reliable service on your schedule</li>
      <li>Customized cleaning plans for your business type</li>
      <li>Eco-friendly cleaning supplies</li>
      <li>100% satisfaction guarantee</li>
      <li>Flexible scheduling to minimize disruption</li>
    </ul>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Services -->
  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h1>Our Corporate Services</h1>
    
    <div class="service-card">
      <h3>Office Cleaning</h3>
      <p>
        Comprehensive office cleaning services including desks, common areas, restrooms, 
        break rooms, and more. Available daily, weekly, or on-demand.
      </p>
      <ul>
        <li>Desk and workstation cleaning</li>
        <li>Restroom sanitization</li>
        <li>Break room cleaning</li>
        <li>Floor vacuuming and mopping</li>
        <li>Trash removal</li>
        <li>Window cleaning (interior)</li>
      </ul>
    </div>

    <div class="service-card">
      <h3>Salon & Barbershop Cleaning</h3>
      <p>
        Specialized cleaning for salons and barbershops, including sanitization of tools, 
        stations, and treatment areas.
      </p>
      <ul>
        <li>Station sanitization</li>
        <li>Tool cleaning and disinfection</li>
        <li>Floor cleaning (hair removal)</li>
        <li>Restroom sanitization</li>
        <li>Reception area cleaning</li>
        <li>Mirror and glass cleaning</li>
      </ul>
    </div>

    <div class="service-card">
      <h3>Restaurant Nightly Cleaning</h3>
      <p>
        Deep cleaning services for restaurants, performed after hours to minimize disruption 
        to your operations.
      </p>
      <ul>
        <li>Kitchen deep cleaning</li>
        <li>Dining area cleaning</li>
        <li>Restroom sanitization</li>
        <li>Floor scrubbing</li>
        <li>Equipment cleaning</li>
        <li>Grease trap maintenance</li>
      </ul>
    </div>

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
    <h1>Benefits of Professional Corporate Cleaning</h1>
    <h2>For Your Business</h2>
    <ul>
      <li><strong>Improved Employee Health:</strong> Regular cleaning reduces germs and allergens, leading to fewer sick days</li>
      <li><strong>Enhanced Professional Image:</strong> A clean workspace creates a positive impression for clients and visitors</li>
      <li><strong>Increased Productivity:</strong> Clean, organized spaces help employees focus and work more efficiently</li>
      <li><strong>Cost Savings:</strong> Outsourcing cleaning is often more cost-effective than hiring in-house staff</li>
      <li><strong>Compliance:</strong> Meet health and safety regulations with professional cleaning standards</li>
      <li><strong>Flexibility:</strong> Customize cleaning schedules to fit your business needs</li>
    </ul>
    <h2>Why VelocityMaid?</h2>
    <ul>
      <li>Experienced team trained in commercial cleaning</li>
      <li>Consistent quality with regular inspections</li>
      <li>Reliable scheduling that works around your business</li>
      <li>Eco-friendly products safe for employees and customers</li>
      <li>Fully insured and bonded for your protection</li>
      <li>Responsive customer service</li>
    </ul>
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
    <h1>Get Started</h1>
    <p>
      Ready to experience the difference professional corporate cleaning can make for your business?
    </p>
    <h2>Next Steps</h2>
    <ol>
      <li><strong>Request a Quote:</strong> Contact us with your business details and cleaning needs</li>
      <li><strong>Custom Proposal:</strong> We'll create a tailored cleaning plan for your business</li>
      <li><strong>Site Visit:</strong> Optional walkthrough to assess your specific requirements</li>
      <li><strong>Agreement:</strong> Review and sign our service agreement</li>
      <li><strong>Service Begins:</strong> We start cleaning on your schedule</li>
    </ol>
    <h2>Contact Information</h2>
    <div style="background: ${brandColors.gray}; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 16px;">
        <strong>VelocityMaid New Jersey</strong><br>
        Email: corporate@velocitymaid.com<br>
        Phone: (555) 123-4567<br>
        Website: velocitymaid.com/corporate/nj<br>
        Serving: Newark, Jersey City, Elizabeth, Union, Hoboken & More
      </p>
    </div>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

