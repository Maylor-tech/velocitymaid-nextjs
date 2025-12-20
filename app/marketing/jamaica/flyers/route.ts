/**
 * Jamaica Marketing Flyers PDF Generator
 * GET /app/marketing/jamaica/flyers?type=[launch|villa|hiring]
 * 
 * Generates printable PDF flyers for Jamaica marketing
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'launch';

  // Generate HTML for PDF (can be converted to PDF using browser print or library)
  const flyers: Record<string, string> = {
    launch: generateLaunchFlyer(),
    villa: generateVillaFlyer(),
    hiring: generateHiringFlyer(),
  };

  const html = flyers[type] || flyers.launch;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `inline; filename="velocitymaid-jamaica-${type}-flyer.html"`,
    },
  });
}

function generateLaunchFlyer(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid Jamaica Launch Flyer</title>
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    body {
      font-family: 'Inter', 'Arial', sans-serif;
      background: linear-gradient(135deg, #F3F1EB 0%, #FFFFFF 100%);
      margin: 0;
      padding: 40px;
      color: #0A3D2F;
    }
    .flyer {
      background: white;
      border: 4px solid #F8C548;
      border-radius: 20px;
      padding: 60px;
      max-width: 8.5in;
      margin: 0 auto;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #0A3D2F;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 56px;
      font-weight: bold;
      color: #0A3D2F;
      margin-bottom: 10px;
      font-family: 'Montserrat', 'Arial', sans-serif;
    }
    .subtitle {
      font-size: 28px;
      color: #2B70C9;
      font-weight: 600;
    }
    .announcement {
      text-align: center;
      margin: 40px 0;
      padding: 30px;
      background: linear-gradient(135deg, #F8C548 0%, #F5B835 100%);
      border-radius: 15px;
      color: #0A3D2F;
    }
    .announcement h1 {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 15px;
      font-family: 'Montserrat', 'Arial', sans-serif;
    }
    .announcement p {
      font-size: 24px;
      margin: 10px 0;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 40px 0;
    }
    .feature {
      background: #F3F1EB;
      padding: 20px;
      border-radius: 10px;
      border-left: 4px solid #2B70C9;
    }
    .feature h3 {
      font-size: 20px;
      font-weight: bold;
      color: #0A3D2F;
      margin-bottom: 10px;
    }
    .feature p {
      font-size: 16px;
      color: #0A3D2F;
      line-height: 1.6;
    }
    .pricing {
      background: #0A3D2F;
      color: white;
      padding: 30px;
      border-radius: 15px;
      margin: 40px 0;
      text-align: center;
    }
    .pricing h2 {
      font-size: 32px;
      margin-bottom: 20px;
      color: #F8C548;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    .pricing-item {
      background: rgba(255,255,255,0.1);
      padding: 20px;
      border-radius: 10px;
    }
    .pricing-item h3 {
      font-size: 18px;
      margin-bottom: 10px;
      color: #F8C548;
    }
    .pricing-item .amount {
      font-size: 28px;
      font-weight: bold;
      color: white;
    }
    .cta {
      text-align: center;
      margin: 40px 0;
      padding: 30px;
      background: #2B70C9;
      color: white;
      border-radius: 15px;
    }
    .cta h2 {
      font-size: 36px;
      margin-bottom: 15px;
      font-family: 'Montserrat', 'Arial', sans-serif;
    }
    .cta p {
      font-size: 20px;
      margin: 10px 0;
    }
    .contact {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #F3F1EB;
    }
    .contact p {
      font-size: 18px;
      margin: 8px 0;
      color: #0A3D2F;
    }
    .contact strong {
      color: #2B70C9;
    }
  </style>
</head>
<body>
  <div class="flyer">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">Jamaica Branch</div>
    </div>

    <div class="announcement">
      <h1>🎉 Now in Port Antonio!</h1>
      <p>Professional Cleaning Services</p>
      <p>5-Star Certified Cleaners</p>
    </div>

    <div class="features">
      <div class="feature">
        <h3>🏠 Home Cleaning</h3>
        <p>Standard, deep, and move-in/out cleaning services</p>
      </div>
      <div class="feature">
        <h3>🏖️ Villa Turnover</h3>
        <p>Specialized services for vacation rentals and Airbnbs</p>
      </div>
      <div class="feature">
        <h3>✨ Linen Reset</h3>
        <p>Professional bed makeover and linen service</p>
      </div>
      <div class="feature">
        <h3>📋 Inventory Checks</h3>
        <p>Comprehensive inventory management and reporting</p>
      </div>
    </div>

    <div class="pricing">
      <h2>Transparent Pricing (JMD)</h2>
      <div class="pricing-grid">
        <div class="pricing-item">
          <h3>Standard Clean</h3>
          <div class="amount">$7,500</div>
        </div>
        <div class="pricing-item">
          <h3>Deep Clean</h3>
          <div class="amount">$12,000</div>
        </div>
        <div class="pricing-item">
          <h3>Move In/Out</h3>
          <div class="amount">$20,000</div>
        </div>
      </div>
    </div>

    <div class="cta">
      <h2>Book Your Cleaning Today!</h2>
      <p>📱 WhatsApp: +1 (876) 555-1985</p>
      <p>🌐 velocitymaid.com/jamaica</p>
    </div>

    <div class="contact">
      <p><strong>VelocityMaid Jamaica</strong></p>
      <p>Port Antonio, Portland, Jamaica</p>
      <p>Professional • Reliable • Certified</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateVillaFlyer(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid Villa Partnership Flyer</title>
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    body {
      font-family: 'Inter', 'Arial', sans-serif;
      background: linear-gradient(135deg, #F3F1EB 0%, #FFFFFF 100%);
      margin: 0;
      padding: 40px;
      color: #0A3D2F;
    }
    .flyer {
      background: white;
      border: 4px solid #F8C548;
      border-radius: 20px;
      padding: 60px;
      max-width: 8.5in;
      margin: 0 auto;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #0A3D2F;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 56px;
      font-weight: bold;
      color: #0A3D2F;
      margin-bottom: 10px;
      font-family: 'Montserrat', 'Arial', sans-serif;
    }
    .subtitle {
      font-size: 32px;
      color: #2B70C9;
      font-weight: 600;
      margin-top: 10px;
    }
    .hero {
      text-align: center;
      margin: 40px 0;
      padding: 40px;
      background: linear-gradient(135deg, #0A3D2F 0%, #2B70C9 100%);
      border-radius: 15px;
      color: white;
    }
    .hero h1 {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #F8C548;
      font-family: 'Montserrat', 'Arial', sans-serif;
    }
    .hero p {
      font-size: 24px;
      margin: 10px 0;
    }
    .services {
      margin: 40px 0;
    }
    .services h2 {
      font-size: 32px;
      color: #0A3D2F;
      margin-bottom: 20px;
      text-align: center;
      font-family: 'Montserrat', 'Arial', sans-serif;
    }
    .service-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .service-item {
      background: #F3F1EB;
      padding: 25px;
      border-radius: 10px;
      border-left: 4px solid #F8C548;
    }
    .service-item h3 {
      font-size: 22px;
      font-weight: bold;
      color: #0A3D2F;
      margin-bottom: 10px;
    }
    .service-item ul {
      margin: 10px 0;
      padding-left: 25px;
    }
    .service-item li {
      font-size: 16px;
      color: #0A3D2F;
      margin: 8px 0;
      line-height: 1.6;
    }
    .pricing {
      background: #F8C548;
      color: #0A3D2F;
      padding: 30px;
      border-radius: 15px;
      margin: 40px 0;
    }
    .pricing h2 {
      font-size: 32px;
      margin-bottom: 20px;
      text-align: center;
      font-family: 'Montserrat', 'Arial', sans-serif;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    .pricing-item {
      background: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
    }
    .pricing-item h3 {
      font-size: 18px;
      margin-bottom: 10px;
      color: #0A3D2F;
    }
    .pricing-item .amount {
      font-size: 28px;
      font-weight: bold;
      color: #2B70C9;
    }
    .cta {
      text-align: center;
      margin: 40px 0;
      padding: 30px;
      background: #2B70C9;
      color: white;
      border-radius: 15px;
    }
    .cta h2 {
      font-size: 36px;
      margin-bottom: 15px;
      font-family: 'Montserrat', 'Arial', sans-serif;
    }
    .cta p {
      font-size: 20px;
      margin: 10px 0;
    }
    .contact {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #F3F1EB;
    }
    .contact p {
      font-size: 18px;
      margin: 8px 0;
      color: #0A3D2F;
    }
  </style>
</head>
<body>
  <div class="flyer">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">Villa Partnership Program</div>
    </div>

    <div class="hero">
      <h1>🏖️ Villa Turnover Services</h1>
      <p>Professional cleaning for vacation rentals</p>
      <p>Port Antonio, Jamaica</p>
    </div>

    <div class="services">
      <h2>What We Offer</h2>
      <div class="service-grid">
        <div class="service-item">
          <h3>✨ Turnover Cleaning</h3>
          <ul>
            <li>Complete villa cleaning</li>
            <li>All bedrooms & bathrooms</li>
            <li>Kitchen & living areas</li>
            <li>Outdoor spaces</li>
          </ul>
        </div>
        <div class="service-item">
          <h3>🛏️ Linen Reset</h3>
          <ul>
            <li>Bed makeover service</li>
            <li>Fresh linens & towels</li>
            <li>Hotel-standard styling</li>
            <li>Pillow arrangement</li>
          </ul>
        </div>
        <div class="service-item">
          <h3>📋 Inventory Check</h3>
          <ul>
            <li>Comprehensive verification</li>
            <li>Restock recommendations</li>
            <li>Missing item reports</li>
            <li>Photo documentation</li>
          </ul>
        </div>
        <div class="service-item">
          <h3>📸 Damage Reporting</h3>
          <ul>
            <li>Detailed photo reports</li>
            <li>Location documentation</li>
            <li>Urgent issue alerts</li>
            <li>2-hour report delivery</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="pricing">
      <h2>Partnership Pricing (JMD)</h2>
      <div class="pricing-grid">
        <div class="pricing-item">
          <h3>Standard</h3>
          <div class="amount">$7,500</div>
        </div>
        <div class="pricing-item">
          <h3>Turnover + Linen</h3>
          <div class="amount">$9,500</div>
        </div>
        <div class="pricing-item">
          <h3>Full Service</h3>
          <div class="amount">$12,000</div>
        </div>
      </div>
    </div>

    <div class="cta">
      <h2>Apply for Partnership</h2>
      <p>📱 WhatsApp: +1 (876) 555-1985</p>
      <p>🌐 velocitymaid.com/villa-partnership</p>
    </div>

    <div class="contact">
      <p><strong>VelocityMaid Jamaica</strong></p>
      <p>Port Antonio, Portland, Jamaica</p>
      <p>Priority Scheduling • Dedicated Support • 5-Star Quality</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateHiringFlyer(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid Hiring Flyer</title>
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    body {
      font-family: 'Inter', 'Arial', sans-serif;
      background: linear-gradient(135deg, #F3F1EB 0%, #FFFFFF 100%);
      margin: 0;
      padding: 40px;
      color: #0A3D2F;
    }
    .flyer {
      background: white;
      border: 4px solid #F8C548;
      border-radius: 20px;
      padding: 60px;
      max-width: 8.5in;
      margin: 0 auto;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #0A3D2F;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 56px;
      font-weight: bold;
      color: #0A3D2F;
      margin-bottom: 10px;
      font-family: 'Montserrat', 'Arial', sans-serif;
    }
    .subtitle {
      font-size: 28px;
      color: #2B70C9;
      font-weight: 600;
    }
    .hero {
      text-align: center;
      margin: 40px 0;
      padding: 40px;
      background: linear-gradient(135deg, #F8C548 0%, #F5B835 100%);
      border-radius: 15px;
      color: #0A3D2F;
    }
    .hero h1 {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 15px;
      font-family: 'Montserrat', 'Arial', sans-serif;
    }
    .hero p {
      font-size: 24px;
      margin: 10px 0;
    }
    .benefits {
      margin: 40px 0;
    }
    .benefits h2 {
      font-size: 32px;
      color: #0A3D2F;
      margin-bottom: 20px;
      text-align: center;
      font-family: 'Montserrat', 'Arial', sans-serif;
    }
    .benefit-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .benefit-item {
      background: #F3F1EB;
      padding: 25px;
      border-radius: 10px;
      border-left: 4px solid #2B70C9;
    }
    .benefit-item h3 {
      font-size: 22px;
      font-weight: bold;
      color: #0A3D2F;
      margin-bottom: 10px;
    }
    .benefit-item p {
      font-size: 16px;
      color: #0A3D2F;
      line-height: 1.6;
    }
    .requirements {
      background: #0A3D2F;
      color: white;
      padding: 30px;
      border-radius: 15px;
      margin: 40px 0;
    }
    .requirements h2 {
      font-size: 32px;
      margin-bottom: 20px;
      text-align: center;
      color: #F8C548;
      font-family: 'Montserrat', 'Arial', sans-serif;
    }
    .requirements ul {
      list-style: none;
      padding: 0;
    }
    .requirements li {
      font-size: 18px;
      margin: 15px 0;
      padding-left: 30px;
      position: relative;
    }
    .requirements li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #F8C548;
      font-weight: bold;
      font-size: 24px;
    }
    .pricing {
      background: #2B70C9;
      color: white;
      padding: 30px;
      border-radius: 15px;
      margin: 40px 0;
      text-align: center;
    }
    .pricing h2 {
      font-size: 32px;
      margin-bottom: 20px;
      color: #F8C548;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    .pricing-item {
      background: rgba(255,255,255,0.1);
      padding: 20px;
      border-radius: 10px;
    }
    .pricing-item h3 {
      font-size: 18px;
      margin-bottom: 10px;
    }
    .pricing-item .amount {
      font-size: 28px;
      font-weight: bold;
      color: #F8C548;
    }
    .cta {
      text-align: center;
      margin: 40px 0;
      padding: 30px;
      background: #F8C548;
      color: #0A3D2F;
      border-radius: 15px;
    }
    .cta h2 {
      font-size: 36px;
      margin-bottom: 15px;
      font-family: 'Montserrat', 'Arial', sans-serif;
    }
    .cta p {
      font-size: 20px;
      margin: 10px 0;
    }
    .contact {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #F3F1EB;
    }
    .contact p {
      font-size: 18px;
      margin: 8px 0;
      color: #0A3D2F;
    }
  </style>
</head>
<body>
  <div class="flyer">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">Jamaica - We're Hiring!</div>
    </div>

    <div class="hero">
      <h1>👷 Join Our Team!</h1>
      <p>Certified Cleaners Needed in Port Antonio</p>
      <p>Competitive Pay • Flexible Schedule • Professional Training</p>
    </div>

    <div class="benefits">
      <h2>Why Join VelocityMaid?</h2>
      <div class="benefit-grid">
        <div class="benefit-item">
          <h3>💰 Competitive Pay</h3>
          <p>Earn competitive rates in JMD with performance bonuses and incentives</p>
        </div>
        <div class="benefit-item">
          <h3>⏰ Flexible Schedule</h3>
          <p>Work on your terms—choose your own hours and availability</p>
        </div>
        <div class="benefit-item">
          <h3>🎓 Professional Training</h3>
          <p>Comprehensive training program with Jamaica Certified Cleaner certification</p>
        </div>
        <div class="benefit-item">
          <h3>📈 Growth Opportunities</h3>
          <p>Build your skills and access future opportunities within VelocityMaid</p>
        </div>
      </div>
    </div>

    <div class="requirements">
      <h2>Requirements</h2>
      <ul>
        <li>18 years or older</li>
        <li>Valid government ID</li>
        <li>Reliable transportation</li>
        <li>Positive attitude</li>
        <li>No previous experience required—we provide training!</li>
      </ul>
    </div>

    <div class="pricing">
      <h2>Earning Potential (JMD)</h2>
      <div class="pricing-grid">
        <div class="pricing-item">
          <h3>Standard Clean</h3>
          <div class="amount">$7,500</div>
        </div>
        <div class="pricing-item">
          <h3>Deep Clean</h3>
          <div class="amount">$12,000</div>
        </div>
        <div class="pricing-item">
          <h3>Move In/Out</h3>
          <div class="amount">$20,000</div>
        </div>
      </div>
      <p style="margin-top: 20px; font-size: 18px;">Plus performance bonuses and referral incentives!</p>
    </div>

    <div class="cta">
      <h2>Apply Today!</h2>
      <p>📱 WhatsApp: +1 (876) 555-1985</p>
      <p>🌐 velocitymaid.com/jamaica/work-with-us</p>
    </div>

    <div class="contact">
      <p><strong>VelocityMaid Jamaica</strong></p>
      <p>Port Antonio, Portland, Jamaica</p>
      <p>Start Your Career in Professional Cleaning</p>
    </div>
  </div>
</body>
</html>
  `;
}


