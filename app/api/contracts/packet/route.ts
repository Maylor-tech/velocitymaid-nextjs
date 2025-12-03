/**
 * VelocityMaid Jamaica Contract Packet PDF Generator
 * GET /api/contracts/packet
 * 
 * Generates a comprehensive multi-page PDF contract packet
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanerAgreementTemplate, customerTermsTemplate, villaPartnershipTemplate } from '@/app/api/contracts/templates';

export async function GET(request: NextRequest) {
  try {
    // Generate comprehensive HTML for multi-page PDF
    const html = generateContractPacketHTML();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-jamaica-contract-packet.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate contract packet error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate contract packet' },
      { status: 500 }
    );
  }
}

function generateContractPacketHTML(): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate contract sections
  const cleanerSections = generateContractSections(cleanerAgreementTemplate);
  const customerSections = generateContractSections(customerTermsTemplate);
  const villaSections = generateContractSections(villaPartnershipTemplate);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid Jamaica - Official Contract Packet</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }
    body {
      font-family: 'Inter', 'Arial', sans-serif;
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
      border-bottom: 4px solid #F8C548;
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo {
      font-size: 36px;
      font-weight: bold;
      color: #0A3D2F;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .subtitle {
      font-size: 18px;
      color: #2B70C9;
      font-weight: 600;
      margin-top: 5px;
    }
    .logo-box {
      width: 70px;
      height: 70px;
      background-color: #F8C548;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0A3D2F;
      font-size: 20px;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 2px solid #F3F1EB;
      text-align: center;
      font-size: 11px;
      color: #6B7280;
    }
    .footer-text {
      margin: 3px 0;
    }
    h1 {
      font-size: 32px;
      font-weight: bold;
      color: #0A3D2F;
      margin: 20px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    h2 {
      font-size: 24px;
      font-weight: bold;
      color: #0A3D2F;
      margin: 25px 0 15px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      border-bottom: 2px solid #F3F1EB;
      padding-bottom: 8px;
    }
    h3 {
      font-size: 18px;
      font-weight: bold;
      color: #0A3D2F;
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
      background: #F3F1EB;
      border-left: 4px solid #F8C548;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .pricing-card {
      background: #0A3D2F;
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .pricing-card h3 {
      color: #F8C548;
      margin: 0 0 10px 0;
      font-size: 18px;
    }
    .pricing-amount {
      font-size: 28px;
      font-weight: bold;
      color: white;
      margin: 10px 0;
    }
    .qr-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
      margin: 30px 0;
      text-align: center;
    }
    .qr-box {
      padding: 20px;
      border: 2px solid #F3F1EB;
      border-radius: 8px;
    }
    .qr-placeholder {
      width: 150px;
      height: 150px;
      background: #F3F1EB;
      border: 2px dashed #0A3D2F;
      margin: 0 auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0A3D2F;
      font-size: 12px;
      text-align: center;
      padding: 10px;
    }
    .section {
      margin-bottom: 30px;
    }
    .cover-page {
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 9.5in;
    }
    .cover-title {
      font-size: 48px;
      font-weight: bold;
      color: #0A3D2F;
      margin: 40px 0 20px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .cover-subtitle {
      font-size: 24px;
      color: #2B70C9;
      margin: 20px 0;
    }
    .cover-date {
      font-size: 16px;
      color: #666;
      margin-top: 40px;
    }
    .signature-section {
      margin: 40px 0;
      padding: 20px;
      border: 2px solid #F3F1EB;
      border-radius: 8px;
    }
    .signature-line {
      border-bottom: 2px solid #333;
      height: 50px;
      margin: 20px 0 10px 0;
      width: 100%;
    }
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .contact-item {
      padding: 15px;
      background: #F3F1EB;
      border-radius: 8px;
    }
    .contact-item strong {
      color: #0A3D2F;
      display: block;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page cover-page">
    <div class="header-content" style="justify-content: center; margin-bottom: 60px;">
      <div>
        <div class="logo">VelocityMaid</div>
        <div class="subtitle">Jamaica Branch</div>
      </div>
    </div>
    <h1 class="cover-title">Official Contract Packet</h1>
    <p class="cover-subtitle">Port Antonio, Jamaica</p>
    <div style="margin: 60px 0;">
      <div class="logo-box" style="margin: 0 auto;">VM</div>
    </div>
    <p style="font-size: 18px; color: #666; margin: 40px 0;">
      Comprehensive Legal Agreements<br>
      Service Standards & Pricing<br>
      Partnership Terms
    </p>
    <p class="cover-date">Generated: ${currentDate}</p>
    <div class="footer">
      <p class="footer-text">A Bornfidis Ecosystem Service • Port Antonio • © 2025</p>
    </div>
  </div>

  <!-- Introduction Letter -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">Jamaica Branch</div>
        </div>
        <div class="logo-box">VM</div>
      </div>
    </div>
    <h1>Welcome to VelocityMaid Jamaica</h1>
    <p>
      Thank you for your interest in VelocityMaid Jamaica, Port Antonio's premier professional cleaning service. 
      This comprehensive contract packet contains all the information you need to understand our services, standards, 
      and legal agreements.
    </p>
    <p>
      VelocityMaid Jamaica is committed to providing 5-star quality cleaning services for homes, villas, guest houses, 
      and vacation rentals across Port Antonio and the surrounding areas. Our team of Jamaica Certified Cleaners undergoes 
      rigorous training to ensure consistent, professional results.
    </p>
    <p>
      This packet includes:
    </p>
    <ul>
      <li>Company profile and service overview</li>
      <li>Villa turnover standards and procedures</li>
      <li>Transparent pricing in Jamaican Dollars (JMD)</li>
      <li>Cleaner standards and expectations</li>
      <li>Complete legal agreements for all service types</li>
      <li>Contact information and support resources</li>
    </ul>
    <p>
      Please review all documents carefully. If you have any questions, our team is available via WhatsApp at 
      +1 (876) 555-1985 or through our website at velocitymaid.com.
    </p>
    <p style="margin-top: 30px;">
      <strong>Best regards,</strong><br>
      <strong>VelocityMaid Jamaica Team</strong><br>
      Port Antonio, Portland, Jamaica
    </p>
    <div class="footer">
      <p class="footer-text">A Bornfidis Ecosystem Service • Port Antonio • © 2025</p>
    </div>
  </div>

  <!-- Company Profile -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">Jamaica Branch</div>
        </div>
        <div class="logo-box">VM</div>
      </div>
    </div>
    <h1>Company Profile</h1>
    <h2>About VelocityMaid Jamaica</h2>
    <p>
      VelocityMaid Jamaica is a professional cleaning service company operating in Port Antonio, Portland, Jamaica. 
      We specialize in providing high-quality cleaning services for residential properties, vacation rentals, villas, 
      and guest houses.
    </p>
    <h3>Our Mission</h3>
    <p>
      To provide reliable, professional, and high-quality cleaning services that exceed customer expectations while 
      creating employment opportunities and supporting the local community in Port Antonio.
    </p>
    <h3>Our Values</h3>
    <ul>
      <li><strong>Quality:</strong> 5-star standards on every job</li>
      <li><strong>Reliability:</strong> Consistent, dependable service</li>
      <li><strong>Professionalism:</strong> Trained, certified cleaners</li>
      <li><strong>Transparency:</strong> Clear pricing and communication</li>
      <li><strong>Community:</strong> Supporting local employment and growth</li>
    </ul>
    <h3>Certification Program</h3>
    <p>
      All VelocityMaid Jamaica cleaners complete a comprehensive training program and earn their Jamaica Certified Cleaner 
      certification. This ensures consistent quality and professionalism across all services.
    </p>
    <h3>Service Areas</h3>
    <p>
      Currently serving Port Antonio and surrounding areas in Portland, Jamaica. We are expanding to additional areas 
      across Jamaica in the coming months.
    </p>
    <div class="footer">
      <p class="footer-text">A Bornfidis Ecosystem Service • Port Antonio • © 2025</p>
    </div>
  </div>

  <!-- Service Overview -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">Jamaica Branch</div>
        </div>
        <div class="logo-box">VM</div>
      </div>
    </div>
    <h1>Service Overview</h1>
    <h2>Residential Cleaning Services</h2>
    <h3>Standard Cleaning</h3>
    <p>Our standard cleaning service includes:</p>
    <ul>
      <li>Dusting all surfaces, furniture, and fixtures</li>
      <li>Vacuuming and mopping all floors</li>
      <li>Cleaning and sanitizing bathrooms</li>
      <li>Kitchen cleaning (countertops, appliances, sink)</li>
      <li>Trash removal</li>
      <li>Basic tidying and organization</li>
    </ul>
    <h3>Deep Cleaning</h3>
    <p>Comprehensive deep cleaning service includes everything in standard cleaning plus:</p>
    <ul>
      <li>Inside and behind appliances</li>
      <li>Baseboards and window sills</li>
      <li>Light fixtures and ceiling fans</li>
      <li>Inside cabinets and drawers</li>
      <li>Detailed bathroom scrubbing</li>
      <li>Interior window cleaning</li>
    </ul>
    <h3>Move In/Out Cleaning</h3>
    <p>Complete cleaning service for properties being vacated or prepared for new occupants:</p>
    <ul>
      <li>Full deep cleaning of entire property</li>
      <li>Inside all cabinets and closets</li>
      <li>Appliance deep cleaning</li>
      <li>Window cleaning (interior)</li>
      <li>Wall spot cleaning</li>
      <li>Final inspection and touch-ups</li>
    </ul>
    <h2>Villa Turnover Services</h2>
    <p>
      Specialized services for vacation rentals, Airbnbs, and villa management companies. See Villa Turnover Standards 
      section for detailed procedures.
    </p>
    <div class="footer">
      <p class="footer-text">A Bornfidis Ecosystem Service • Port Antonio • © 2025</p>
    </div>
  </div>

  <!-- Villa Turnover Standards -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">Jamaica Branch</div>
        </div>
        <div class="logo-box">VM</div>
      </div>
    </div>
    <h1>Villa Turnover Standards</h1>
    <h2>5-Star Quality Standards</h2>
    <p>
      All villa turnovers are completed to 5-star hotel standards, ensuring every property is guest-ready upon completion.
    </p>
    <h3>Linen Reset Procedure</h3>
    <ul>
      <li>Remove all used linens from beds</li>
      <li>Inspect mattresses for stains or damage</li>
      <li>Place fresh fitted sheet on mattress with tight fit</li>
      <li>Add flat sheet with hospital corners</li>
      <li>Arrange pillows: 2 standard pillows per bed, 1 decorative pillow</li>
      <li>Place fresh duvet/comforter with even distribution</li>
      <li>Place fresh towels in bathroom: 2 bath, 2 hand, 2 washcloths per bathroom</li>
      <li>Ensure all linens are clean, pressed, and free of stains</li>
      <li>Document any damaged or missing linens</li>
    </ul>
    <h3>Bedroom Styling</h3>
    <ul>
      <li>Dust all surfaces: nightstands, dressers, headboards, picture frames</li>
      <li>Vacuum or mop floors (depending on floor type)</li>
      <li>Clean windows and mirrors</li>
      <li>Empty trash bins and replace liners</li>
      <li>Check and restock amenities (if applicable)</li>
      <li>Ensure all lights are working</li>
      <li>Check air conditioning/ventilation</li>
      <li>Verify closet is empty and clean</li>
      <li>Take before/after photos</li>
      <li>Document any damage or maintenance issues</li>
    </ul>
    <h3>Bathroom Reset</h3>
    <ul>
      <li>Remove all used towels and linens</li>
      <li>Clean and sanitize toilet (inside and out)</li>
      <li>Clean and sanitize shower/tub</li>
      <li>Clean mirrors and glass surfaces</li>
      <li>Clean and sanitize sink and countertops</li>
      <li>Clean floor and baseboards</li>
      <li>Restock toilet paper (minimum 2 rolls)</li>
      <li>Restock hand soap</li>
      <li>Place fresh towels: 2 bath, 2 hand, 2 washcloths</li>
      <li>Check and restock toiletries (if applicable)</li>
      <li>Verify all fixtures are working</li>
      <li>Take before/after photos</li>
      <li>Document any damage or maintenance issues</li>
    </ul>
    <h3>Kitchen Reset</h3>
    <ul>
      <li>Clean and sanitize all countertops</li>
      <li>Clean and sanitize sink</li>
      <li>Clean stovetop and oven (if applicable)</li>
      <li>Clean microwave (inside and out)</li>
      <li>Clean refrigerator (inside and out)</li>
      <li>Clean dishwasher (inside and out)</li>
      <li>Check and restock dish soap</li>
      <li>Check and restock paper towels</li>
      <li>Verify all appliances are working</li>
      <li>Check inventory: dishes, utensils, cookware</li>
      <li>Document any missing or damaged items</li>
      <li>Take before/after photos</li>
    </ul>
    <h3>Photo Documentation</h3>
    <ul>
      <li>Take before photos of each room (if applicable)</li>
      <li>Take after photos of each room</li>
      <li>Focus on: beds, bathrooms, kitchen, living areas</li>
      <li>Capture any damage or maintenance issues</li>
      <li>Ensure photos are clear and well-lit</li>
      <li>Include timestamp in photo metadata</li>
      <li>Upload photos to job report within 2 hours</li>
      <li>Organize photos by room for easy review</li>
    </ul>
    <h3>Damage Reporting Process</h3>
    <ul>
      <li>Inspect entire villa for damage during cleaning</li>
      <li>Document any damage with clear photos</li>
      <li>Note location of damage (room, specific area)</li>
      <li>Describe damage in detail (size, type, severity)</li>
      <li>Check for missing items or inventory discrepancies</li>
      <li>Complete damage report form</li>
      <li>Submit report within 2 hours of completion</li>
      <li>Include photos and detailed descriptions</li>
      <li>Notify villa manager via WhatsApp if urgent</li>
      <li>Keep copy of report for records</li>
    </ul>
    <div class="footer">
      <p class="footer-text">A Bornfidis Ecosystem Service • Port Antonio • © 2025</p>
    </div>
  </div>

  <!-- Pricing Page -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">Jamaica Branch</div>
        </div>
        <div class="logo-box">VM</div>
      </div>
    </div>
    <h1>Pricing Overview (JMD)</h1>
    <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
      All prices are in Jamaican Dollars (JMD). Transparent pricing with no hidden fees.
    </p>
    <h2>Residential Cleaning</h2>
    <div class="pricing-grid">
      <div class="pricing-card">
        <h3>Standard Clean</h3>
        <div class="pricing-amount">JMD $7,500</div>
        <p style="font-size: 12px; margin: 0;">Per service</p>
      </div>
      <div class="pricing-card">
        <h3>Deep Clean</h3>
        <div class="pricing-amount">JMD $12,000</div>
        <p style="font-size: 12px; margin: 0;">Per service</p>
      </div>
      <div class="pricing-card">
        <h3>Move In/Out</h3>
        <div class="pricing-amount">JMD $20,000</div>
        <p style="font-size: 12px; margin: 0;">Per service</p>
      </div>
    </div>
    <h2>Villa Partnership Pricing</h2>
    <div class="pricing-grid">
      <div class="pricing-card">
        <h3>Standard Turnover</h3>
        <div class="pricing-amount">JMD $7,500</div>
        <p style="font-size: 12px; margin: 0;">Per turnover</p>
      </div>
      <div class="pricing-card">
        <h3>Turnover + Linen</h3>
        <div class="pricing-amount">JMD $9,500</div>
        <p style="font-size: 12px; margin: 0;">Per turnover</p>
      </div>
      <div class="pricing-card">
        <h3>Full Service</h3>
        <div class="pricing-amount">JMD $12,000</div>
        <p style="font-size: 12px; margin: 0;">Per turnover</p>
      </div>
    </div>
    <div class="highlight-box">
      <p style="margin: 0;"><strong>Custom Pricing Available:</strong> Weekly and monthly contracts receive discounted rates. 
      Contact us for a custom quote based on your property size and turnover frequency.</p>
    </div>
    <h2>Payment Methods</h2>
    <ul>
      <li>Cash (JMD) - On arrival or completion</li>
      <li>Bank transfer</li>
      <li>Online payment</li>
      <li>Credit/debit card</li>
    </ul>
    <h2>Additional Services</h2>
    <ul>
      <li>Performance bonuses for cleaners</li>
      <li>Referral incentives</li>
      <li>Loyalty program discounts</li>
      <li>Recurring service discounts</li>
    </ul>
    <div class="footer">
      <p class="footer-text">A Bornfidis Ecosystem Service • Port Antonio • © 2025</p>
    </div>
  </div>

  <!-- Cleaner Standards -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">Jamaica Branch</div>
        </div>
        <div class="logo-box">VM</div>
      </div>
    </div>
    <h1>Cleaner Standards & Expectations</h1>
    <h2>Jamaica Certified Cleaner Requirements</h2>
    <p>
      All VelocityMaid Jamaica cleaners must complete comprehensive training and earn their Jamaica Certified Cleaner 
      certification before being eligible for job assignments.
    </p>
    <h3>Training Requirements</h3>
    <ul>
      <li>Complete all required training modules</li>
      <li>Pass all quizzes with 70% or higher</li>
      <li>Complete practical assessments</li>
      <li>Obtain Jamaica Certified Cleaner badge</li>
      <li>Training must be completed within 30 days of approval</li>
    </ul>
    <h3>Quality Standards</h3>
    <p>Cleaners must maintain 5-star quality standards on every job:</p>
    <ul>
      <li>All surfaces cleaned and sanitized</li>
      <li>Floors vacuumed and mopped</li>
      <li>Bathrooms spotless and sanitized</li>
      <li>Kitchens thoroughly cleaned</li>
      <li>Trash removed and bins cleaned</li>
      <li>Photo documentation completed</li>
      <li>Checklist items verified</li>
    </ul>
    <h3>Professional Conduct</h3>
    <ul>
      <li>Arrive on time for all assignments</li>
      <li>Maintain professional appearance</li>
      <li>Respect customer property and privacy</li>
      <li>Communicate clearly and professionally</li>
      <li>Follow all safety protocols</li>
      <li>Report any issues or concerns immediately</li>
    </ul>
    <h3>Job Quality Score (JQS)</h3>
    <p>Cleaners are evaluated on:</p>
    <ul>
      <li>On-time arrival (10 points)</li>
      <li>Checklist completion (10 points)</li>
      <li>Photo documentation (10 points)</li>
      <li>Customer rating (up to 40 points)</li>
      <li>No complaints (30 points)</li>
    </ul>
    <p>Total possible score: 100 points. High scores qualify for performance bonuses.</p>
    <h3>Compensation</h3>
    <p>Cleaners earn competitive rates in JMD:</p>
    <ul>
      <li>Standard Clean: JMD $7,500</li>
      <li>Deep Clean: JMD $12,000</li>
      <li>Move In/Out: JMD $20,000</li>
      <li>Performance bonuses based on JQS</li>
      <li>5-star review bonuses</li>
      <li>Attendance bonuses</li>
    </ul>
    <h3>Availability Requirements</h3>
    <ul>
      <li>Maintain accurate availability in system</li>
      <li>Accept minimum 70% of assigned jobs</li>
      <li>Update availability at least weekly</li>
      <li>Notify of blackout dates in advance</li>
    </ul>
    <div class="footer">
      <p class="footer-text">A Bornfidis Ecosystem Service • Port Antonio • © 2025</p>
    </div>
  </div>

  <!-- Cleaner Agreement -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">Jamaica Branch</div>
        </div>
        <div class="logo-box">VM</div>
      </div>
    </div>
    <h1>Cleaner Agreement</h1>
    ${cleanerSections}
    <div class="signature-section">
      <p style="margin-bottom: 30px;">By signing below, I acknowledge that I have read, understood, and agree to be bound by all terms and conditions of this Agreement.</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
        <div>
          <div class="signature-line"></div>
          <p style="font-size: 12px; color: #666; margin: 0;">Cleaner Signature</p>
        </div>
        <div>
          <div class="signature-line"></div>
          <p style="font-size: 12px; color: #666; margin: 0;">Date</p>
        </div>
      </div>
      <div style="margin-top: 40px;">
        <p style="font-size: 14px; margin-bottom: 30px;">VelocityMaid Jamaica Representative:</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          <div>
            <div class="signature-line"></div>
            <p style="font-size: 12px; color: #666; margin: 0;">Authorized Signature</p>
          </div>
          <div>
            <div class="signature-line"></div>
            <p style="font-size: 12px; color: #666; margin: 0;">Date</p>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">A Bornfidis Ecosystem Service • Port Antonio • © 2025</p>
    </div>
  </div>

  <!-- Customer Terms -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">Jamaica Branch</div>
        </div>
        <div class="logo-box">VM</div>
      </div>
    </div>
    <h1>Customer Terms of Service</h1>
    ${customerSections}
    <div class="footer">
      <p class="footer-text">A Bornfidis Ecosystem Service • Port Antonio • © 2025</p>
    </div>
  </div>

  <!-- Villa Partnership Agreement -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">Jamaica Branch</div>
        </div>
        <div class="logo-box">VM</div>
      </div>
    </div>
    <h1>Villa Partnership Agreement</h1>
    ${villaSections}
    <div class="signature-section">
      <p style="margin-bottom: 30px;">By signing below, I acknowledge that I have read, understood, and agree to be bound by all terms and conditions of this Agreement.</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
        <div>
          <div class="signature-line"></div>
          <p style="font-size: 12px; color: #666; margin: 0;">Partner Signature</p>
        </div>
        <div>
          <div class="signature-line"></div>
          <p style="font-size: 12px; color: #666; margin: 0;">Date</p>
        </div>
      </div>
      <div style="margin-top: 40px;">
        <p style="font-size: 14px; margin-bottom: 30px;">VelocityMaid Jamaica Representative:</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          <div>
            <div class="signature-line"></div>
            <p style="font-size: 12px; color: #666; margin: 0;">Authorized Signature</p>
          </div>
          <div>
            <div class="signature-line"></div>
            <p style="font-size: 12px; color: #666; margin: 0;">Date</p>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">A Bornfidis Ecosystem Service • Port Antonio • © 2025</p>
    </div>
  </div>

  <!-- QR Code Page -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">Jamaica Branch</div>
        </div>
        <div class="logo-box">VM</div>
      </div>
    </div>
    <h1>Quick Access QR Codes</h1>
    <p style="text-align: center; margin-bottom: 40px;">
      Scan these QR codes for quick access to our services and resources
    </p>
    <div class="qr-section">
      <div class="qr-box">
        <div class="qr-placeholder">
          QR Code<br>Jamaica Landing Page<br><br>velocitymaid.com/jamaica
        </div>
        <p style="font-size: 12px; margin: 0;"><strong>Jamaica Services</strong></p>
        <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">velocitymaid.com/jamaica</p>
      </div>
      <div class="qr-box">
        <div class="qr-placeholder">
          QR Code<br>Villa Partnership<br><br>velocitymaid.com/villa-partnership
        </div>
        <p style="font-size: 12px; margin: 0;"><strong>Villa Partnership</strong></p>
        <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">velocitymaid.com/villa-partnership</p>
      </div>
      <div class="qr-box">
        <div class="qr-placeholder">
          QR Code<br>WhatsApp Direct<br><br>wa.me/18765551985
        </div>
        <p style="font-size: 12px; margin: 0;"><strong>WhatsApp Support</strong></p>
        <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">+1 (876) 555-1985</p>
      </div>
    </div>
    <div style="margin-top: 40px; padding: 20px; background: #F3F1EB; border-radius: 8px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Note:</strong> QR codes can be generated using any QR code generator. Simply input the URLs above 
        and generate the codes. Replace the placeholders with actual QR code images for production use.
      </p>
    </div>
    <div class="footer">
      <p class="footer-text">A Bornfidis Ecosystem Service • Port Antonio • © 2025</p>
    </div>
  </div>

  <!-- Contact Page -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">Jamaica Branch</div>
        </div>
        <div class="logo-box">VM</div>
      </div>
    </div>
    <h1>Contact Information</h1>
    <h2>Get in Touch</h2>
    <div class="contact-grid">
      <div class="contact-item">
        <strong>WhatsApp</strong>
        <p style="margin: 0; font-size: 14px;">+1 (876) 555-1985</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">24/7 Support</p>
      </div>
      <div class="contact-item">
        <strong>Website</strong>
        <p style="margin: 0; font-size: 14px;">velocitymaid.com</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Book online</p>
      </div>
      <div class="contact-item">
        <strong>Jamaica Services</strong>
        <p style="margin: 0; font-size: 14px;">velocitymaid.com/jamaica</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Service information</p>
      </div>
      <div class="contact-item">
        <strong>Villa Partnership</strong>
        <p style="margin: 0; font-size: 14px;">velocitymaid.com/villa-partnership</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Partnership program</p>
      </div>
      <div class="contact-item">
        <strong>Work With Us</strong>
        <p style="margin: 0; font-size: 14px;">velocitymaid.com/jamaica/work-with-us</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Join our team</p>
      </div>
      <div class="contact-item">
        <strong>Location</strong>
        <p style="margin: 0; font-size: 14px;">Port Antonio, Portland</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Jamaica</p>
      </div>
    </div>
    <h2>Business Hours</h2>
    <ul>
      <li><strong>Customer Support:</strong> 24/7 via WhatsApp</li>
      <li><strong>Booking:</strong> Available 24/7 online</li>
      <li><strong>Service Hours:</strong> Flexible scheduling based on cleaner availability</li>
    </ul>
    <h2>Emergency Contact</h2>
    <p>
      For urgent matters or service issues, contact us immediately via WhatsApp at +1 (876) 555-1985. 
      We respond to all messages within 2 hours during business hours.
    </p>
    <h2>Social Media</h2>
    <ul>
      <li>Follow us for updates and special offers</li>
      <li>Share your experience and reviews</li>
      <li>Stay connected with the VelocityMaid Jamaica community</li>
    </ul>
    <div class="footer">
      <p class="footer-text">A Bornfidis Ecosystem Service • Port Antonio • © 2025</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateContractSections(template: any): string {
  return template.sections.map((section: any) => `
    <div class="section">
      <h3>${section.title}</h3>
      <p>${section.content}</p>
    </div>
  `).join('');
}

