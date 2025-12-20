/**
 * Villa Partnership Brochure PDF
 * GET /villa-partnership/brochure
 * 
 * Generates and returns a PDF brochure for villa partnerships
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Generate HTML for PDF (can be converted to PDF using browser print or library)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid Villa Partnership Program</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }
    body {
      font-family: 'Times New Roman', serif;
      line-height: 1.6;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 4px solid #1e40af;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 42px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 24px;
      color: #4b5563;
      margin-bottom: 5px;
    }
    .location {
      font-size: 18px;
      color: #6b7280;
    }
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 28px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .section-content {
      margin-left: 20px;
    }
    .section-content ul {
      margin: 0;
      padding-left: 25px;
    }
    .section-content li {
      margin-bottom: 12px;
      line-height: 1.8;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .pricing-card {
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .pricing-title {
      font-size: 20px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 10px;
    }
    .pricing-amount {
      font-size: 32px;
      font-weight: bold;
      color: #059669;
      margin-bottom: 10px;
    }
    .pricing-features {
      text-align: left;
      margin-top: 15px;
    }
    .pricing-features li {
      margin-bottom: 8px;
      font-size: 14px;
    }
    .highlight-box {
      background: #f0f9ff;
      border-left: 4px solid #1e40af;
      padding: 20px;
      margin: 20px 0;
    }
    .contact-section {
      background: #1e40af;
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-top: 40px;
      text-align: center;
    }
    .contact-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .contact-info {
      font-size: 18px;
      margin-bottom: 10px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">VelocityMaid</div>
    <div class="subtitle">Villa Partnership Program</div>
    <div class="location">Port Antonio, Jamaica</div>
  </div>

  <div class="section">
    <div class="section-title">Overview</div>
    <div class="section-content">
      <p>VelocityMaid's Villa Partnership Program is designed specifically for vacation rental owners, villa managers, and property management companies in Port Antonio, Jamaica. We provide professional turnover cleaning, linen reset, inventory management, and damage reporting services that ensure your villa is guest-ready every time.</p>
      <p>Our certified cleaners are trained to 5-star standards and understand the unique needs of vacation rentals. With our partnership program, you'll receive priority scheduling, dedicated support, and consistent quality that maintains your villa's reputation.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Services Included</div>
    <div class="section-content">
      <ul>
        <li><strong>Professional Turnover Cleaning:</strong> Complete villa cleaning including all bedrooms, bathrooms, kitchen, living areas, and outdoor spaces</li>
        <li><strong>Linen Reset Service:</strong> Professional bed makeover with fresh linens, pillow arrangement, and towel setup</li>
        <li><strong>Inventory Check:</strong> Comprehensive inventory verification and restock recommendations</li>
        <li><strong>Damage Reporting:</strong> Detailed photo documentation and damage reports after each clean</li>
        <li><strong>Guest Ready Standards:</strong> Every villa cleaned to 5-star hotel standards</li>
        <li><strong>Trained Staff:</strong> Jamaica Certified Cleaners with specialized villa training</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Pricing (JMD)</div>
    <div class="pricing-grid">
      <div class="pricing-card">
        <div class="pricing-title">Standard Turnover</div>
        <div class="pricing-amount">JMD $7,500</div>
        <div class="pricing-features">
          <ul>
            <li>Full villa clean</li>
            <li>Bathroom reset</li>
            <li>Kitchen reset</li>
            <li>Photo documentation</li>
          </ul>
        </div>
      </div>
      <div class="pricing-card" style="border-color: #1e40af; border-width: 3px;">
        <div class="pricing-title">Turnover + Linen</div>
        <div class="pricing-amount">JMD $9,500</div>
        <div class="pricing-features">
          <ul>
            <li>Everything in Standard</li>
            <li>Bed makeover & linen reset</li>
            <li>Photo documentation</li>
          </ul>
        </div>
      </div>
      <div class="pricing-card">
        <div class="pricing-title">Full Service</div>
        <div class="pricing-amount">JMD $12,000</div>
        <div class="pricing-features">
          <ul>
            <li>Everything in Turnover + Linen</li>
            <li>Inventory check & report</li>
            <li>Damage reporting</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="highlight-box">
      <p><strong>Custom Pricing Available:</strong> Weekly and monthly contracts receive discounted rates. Contact us for a custom quote based on your villa size and turnover frequency.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Standard Operating Procedures</div>
    <div class="section-content">
      <p>Our Villa Turnover SOP ensures consistent quality across all properties:</p>
      <ul>
        <li><strong>Linen Reset:</strong> Fresh linens on all beds, proper pillow arrangement, towel setup in bathrooms</li>
        <li><strong>Bedroom Styling:</strong> Beds made to hotel standards, surfaces dusted, floors vacuumed/mopped</li>
        <li><strong>Bathroom Reset:</strong> All surfaces sanitized, mirrors cleaned, fresh towels, toiletries restocked</li>
        <li><strong>Kitchen Reset:</strong> Appliances cleaned, countertops sanitized, dishes checked, inventory verified</li>
        <li><strong>Photo Documentation:</strong> Before/after photos of all rooms, damage photos if any</li>
        <li><strong>Damage Reporting:</strong> Detailed report with photos sent within 2 hours of completion</li>
      </ul>
      <p>For complete SOP details, visit: <strong>https://velocitymaid.com/villa-partnership/sop</strong></p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Why Choose VelocityMaid?</div>
    <div class="section-content">
      <ul>
        <li><strong>Jamaica Certified Cleaners:</strong> All staff complete comprehensive training and certification</li>
        <li><strong>Consistent Quality:</strong> 5-star standards on every clean</li>
        <li><strong>Priority Scheduling:</strong> Partnership properties receive priority booking</li>
        <li><strong>Dedicated Support:</strong> Account manager assigned to each partnership</li>
        <li><strong>24/7 WhatsApp Support:</strong> Direct communication channel for urgent needs</li>
        <li><strong>Flexible Scheduling:</strong> Accommodate last-minute turnovers and schedule changes</li>
      </ul>
    </div>
  </div>

  <div class="contact-section">
    <div class="contact-title">Get Started Today</div>
    <div class="contact-info">
      <p><strong>WhatsApp:</strong> +1 (876) 555-1985</p>
      <p><strong>Email:</strong> partnerships@velocitymaid.com</p>
      <p><strong>Website:</strong> https://velocitymaid.com/villa-partnership</p>
    </div>
    <p style="margin-top: 20px; font-size: 16px;">Apply online or contact us via WhatsApp to discuss your partnership needs.</p>
  </div>

  <div class="footer">
    <p>VelocityMaid Jamaica - Villa Partnership Program</p>
    <p>Port Antonio, Portland, Jamaica</p>
    <p>© ${new Date().getFullYear()} VelocityMaid. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': 'inline; filename="velocitymaid-villa-partnership-brochure.html"',
    },
  });
}


