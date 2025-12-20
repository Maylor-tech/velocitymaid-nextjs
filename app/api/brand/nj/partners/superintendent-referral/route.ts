export const dynamic = 'force-dynamic'

/**
 * VelocityMaid New Jersey Superintendent Referral Program
 * GET /api/brand/nj/partners/superintendent-referral
 * 
 * Generates superintendent referral program document as HTML (printable to PDF)
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
    const html = generateSuperintendentReferral();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-superintendent-referral.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate superintendent referral error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate referral program' },
      { status: 500 }
    );
  }
}

function generateSuperintendentReferral(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Superintendent Referral Program</title>
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
    .promo-box {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin: 30px 0;
    }
    .promo-box h2 {
      font-size: 48px;
      font-weight: bold;
      margin: 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .promo-box p {
      font-size: 20px;
      margin: 10px 0;
      font-weight: 600;
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
    .benefit-card {
      background: ${brandColors.gray};
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid ${brandColors.accent};
      margin: 15px 0;
    }
    .benefit-card h3 {
      color: ${brandColors.primary};
      margin: 0 0 10px 0;
    }
    .contact-box {
      background: ${brandColors.primary};
      color: white;
      padding: 25px;
      border-radius: 8px;
      text-align: center;
      margin: 30px 0;
    }
    .contact-box h3 {
      color: ${brandColors.accent};
      margin: 0 0 15px 0;
    }
    .contact-box p {
      color: white;
      margin: 8px 0;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">VelocityMaid</div>
    <div style="font-size: 18px; color: rgba(255,255,255,0.9);">New Jersey</div>
    <h1 class="title">Superintendent Referral Program</h1>
    <p style="font-size: 18px; margin: 10px 0 0 0;">Earn rewards for referring residents to VelocityMaid</p>
  </div>

  <div class="promo-box">
    <h2>$50</h2>
    <p>For Every Referral That Books</p>
  </div>

  <h2>How It Works</h2>
  <p>
    As a superintendent or property manager, you're in a unique position to help residents find 
    quality cleaning services. Our referral program rewards you for every resident you refer who 
    books a cleaning with VelocityMaid.
  </p>

  <div class="benefit-card">
    <h3>Simple Process</h3>
    <ol>
      <li>Refer a resident to VelocityMaid</li>
      <li>Resident books a cleaning (any service type)</li>
      <li>Resident completes their first cleaning</li>
      <li>You receive $50 via check or direct deposit</li>
    </ol>
  </div>

  <h2>Referral Benefits</h2>
  <div class="benefit-card">
    <h3>For You</h3>
    <ul>
      <li>$50 for every successful referral</li>
      <li>No limit on referrals</li>
      <li>Easy tracking and payment</li>
      <li>Monthly payment processing</li>
    </ul>
  </div>

  <div class="benefit-card">
    <h3>For Your Residents</h3>
    <ul>
      <li>15% OFF their first cleaning</li>
      <li>Professional, background-checked cleaners</li>
      <li>100% satisfaction guarantee</li>
      <li>Flexible scheduling</li>
      <li>Competitive pricing</li>
    </ul>
  </div>

  <h2>Referral Methods</h2>
  <p>You can refer residents in several ways:</p>
  <ul>
    <li><strong>Direct Referral:</strong> Share our contact information or website</li>
    <li><strong>Leave-Behind Cards:</strong> Distribute our referral cards to residents</li>
    <li><strong>Email:</strong> Forward our service information to residents</li>
    <li><strong>Building Newsletter:</strong> Include VelocityMaid in your building communications</li>
  </ul>

  <h2>Tracking Referrals</h2>
  <p>
    When a resident books, they simply mention your name or property name. We'll track the referral 
    and ensure you receive credit. You'll receive a monthly statement showing all referrals and 
    earnings.
  </p>

  <h2>Payment Terms</h2>
  <ul>
    <li>Payments processed monthly</li>
    <li>Minimum $50 to process payment</li>
    <li>Payment via check or direct deposit</li>
    <li>1099 issued for annual earnings over $600</li>
  </ul>

  <h2>Why Residents Love VelocityMaid</h2>
  <ul>
    <li>✓ Background-checked, insured cleaners</li>
    <li>✓ Flat-rate pricing (no surprises)</li>
    <li>✓ Eco-friendly cleaning supplies</li>
    <li>✓ 100% satisfaction guarantee</li>
    <li>✓ Easy online booking</li>
    <li>✓ Flexible scheduling</li>
  </ul>

  <div class="contact-box">
    <h3>Get Started Today</h3>
    <p><strong>Email:</strong> partners@velocitymaid.com</p>
    <p><strong>Phone:</strong> (555) 123-4567</p>
    <p><strong>Website:</strong> velocitymaid.com/partners/apartments</p>
    <p style="margin-top: 15px; font-size: 14px;">Mention this referral program when you contact us!</p>
  </div>
</body>
</html>
  `.trim();
}


