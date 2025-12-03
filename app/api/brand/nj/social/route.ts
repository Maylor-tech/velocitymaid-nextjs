/**
 * VelocityMaid New Jersey Social Media Template Generator
 * GET /api/brand/nj/social?type={templateType}
 * 
 * Generates social media templates as HTML (printable to PNG)
 */

import { NextRequest, NextResponse } from 'next/server';

const brandColors = {
  primary: '#0A3D2F',
  accent: '#F8C548',
  accent2: '#2B70C9',
  white: '#FFFFFF',
  neutral: '#F3F1EB',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'before-after';
    const format = searchParams.get('format') || 'square'; // square or story

    const width = format === 'story' ? 1080 : 1080;
    const height = format === 'story' ? 1920 : 1080;

    const html = generateSocialTemplate(type, width, height);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="velocitymaid-nj-${type}-${format}.html"`,
      },
    });
  } catch (error: any) {
    console.error('Generate social template error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate template' },
      { status: 500 }
    );
  }
}

function generateSocialTemplate(type: string, width: number, height: number): string {
  const baseStyles = `
    body {
      margin: 0;
      padding: 0;
      width: ${width}px;
      height: ${height}px;
      font-family: 'Inter', 'Arial', sans-serif;
      overflow: hidden;
    }
    .container {
      width: ${width}px;
      height: ${height}px;
      position: relative;
      background: ${brandColors.white};
    }
    .logo {
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      font-weight: bold;
      color: ${brandColors.primary};
    }
    .accent {
      color: ${brandColors.accent};
    }
  `;

  switch (type) {
    case 'before-after':
      return generateBeforeAfterTemplate(width, height, baseStyles);
    case 'deep-clean':
      return generateDeepCleanTemplate(width, height, baseStyles);
    case 'pricing':
      return generatePricingTemplate(width, height, baseStyles);
    case 'announcement':
      return generateAnnouncementTemplate(width, height, baseStyles);
    case 'testimonial':
      return generateTestimonialTemplate(width, height, baseStyles);
    case 'recruitment':
      return generateRecruitmentTemplate(width, height, baseStyles);
    case 'openings':
      return generateOpeningsTemplate(width, height, baseStyles);
    default:
      return generateBeforeAfterTemplate(width, height, baseStyles);
  }
}

function generateBeforeAfterTemplate(width: number, height: number, baseStyles: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: linear-gradient(135deg, ${brandColors.primary} 0%, #083025 100%);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
    }
    .logo-text {
      font-size: ${width === 1080 ? '64' : '48'}px;
      margin-bottom: 20px;
    }
    .title {
      font-size: ${width === 1080 ? '72' : '56'}px;
      font-weight: bold;
      margin: 30px 0;
      text-align: center;
    }
    .comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin: 40px 0;
      width: 100%;
    }
    .before, .after {
      background: rgba(255,255,255,0.1);
      padding: 30px;
      border-radius: 12px;
      text-align: center;
    }
    .before h3, .after h3 {
      font-size: ${width === 1080 ? '36' : '28'}px;
      margin: 0 0 20px 0;
    }
    .cta {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 20px 40px;
      border-radius: 8px;
      font-size: ${width === 1080 ? '32' : '24'}px;
      font-weight: bold;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo logo-text">VelocityMaid New Jersey</div>
    <h1 class="title">Before & After</h1>
    <div class="comparison">
      <div class="before">
        <h3>Before</h3>
        <p style="font-size: ${width === 1080 ? '24' : '18'}px;">Your space before our service</p>
      </div>
      <div class="after">
        <h3>After</h3>
        <p style="font-size: ${width === 1080 ? '24' : '18'}px;">Spotless and refreshed</p>
      </div>
    </div>
    <div class="cta">Book Your Cleaning Today</div>
  </div>
</body>
</html>
  `.trim();
}

function generateDeepCleanTemplate(width: number, height: number, baseStyles: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: ${brandColors.white};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
    }
    .header {
      background: ${brandColors.primary};
      color: white;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      width: 100%;
      margin-bottom: 40px;
    }
    .logo-text {
      font-size: ${width === 1080 ? '56' : '42'}px;
      margin-bottom: 20px;
    }
    .title {
      font-size: ${width === 1080 ? '64' : '48'}px;
      font-weight: bold;
      color: ${brandColors.accent};
      margin: 0;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      width: 100%;
      margin: 30px 0;
    }
    .feature {
      background: ${brandColors.neutral};
      padding: 25px;
      border-radius: 8px;
      border-left: 4px solid ${brandColors.accent};
    }
    .feature h3 {
      color: ${brandColors.primary};
      font-size: ${width === 1080 ? '28' : '22'}px;
      margin: 0 0 10px 0;
    }
    .cta {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 20px 40px;
      border-radius: 8px;
      font-size: ${width === 1080 ? '32' : '24'}px;
      font-weight: bold;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo logo-text">VelocityMaid New Jersey</div>
      <h1 class="title">Deep Clean Special</h1>
    </div>
    <div class="features">
      <div class="feature">
        <h3>✓ Inside Appliances</h3>
        <p style="font-size: ${width === 1080 ? '20' : '16'}px;">Oven, fridge, microwave</p>
      </div>
      <div class="feature">
        <h3>✓ Baseboards & Sills</h3>
        <p style="font-size: ${width === 1080 ? '20' : '16'}px;">Detailed edge cleaning</p>
      </div>
      <div class="feature">
        <h3>✓ Light Fixtures</h3>
        <p style="font-size: ${width === 1080 ? '20' : '16'}px;">Ceiling fans & fixtures</p>
      </div>
      <div class="feature">
        <h3>✓ Cabinet Interiors</h3>
        <p style="font-size: ${width === 1080 ? '20' : '16'}px;">Full interior cleaning</p>
      </div>
    </div>
    <div class="cta">Book Your Deep Clean</div>
  </div>
</body>
</html>
  `.trim();
}

function generatePricingTemplate(width: number, height: number, baseStyles: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: linear-gradient(135deg, ${brandColors.neutral} 0%, ${brandColors.white} 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
    }
    .logo-text {
      font-size: ${width === 1080 ? '56' : '42'}px;
      color: ${brandColors.primary};
      margin-bottom: 30px;
    }
    .title {
      font-size: ${width === 1080 ? '64' : '48'}px;
      font-weight: bold;
      color: ${brandColors.primary};
      margin: 0 0 40px 0;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 25px;
      width: 100%;
      margin: 30px 0;
    }
    .price-card {
      background: ${brandColors.primary};
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      border: 3px solid ${brandColors.accent};
    }
    .price-card h3 {
      color: ${brandColors.accent};
      font-size: ${width === 1080 ? '32' : '24'}px;
      margin: 0 0 15px 0;
    }
    .price {
      font-size: ${width === 1080 ? '48' : '36'}px;
      font-weight: bold;
      margin: 15px 0;
    }
    .cta {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 20px 40px;
      border-radius: 8px;
      font-size: ${width === 1080 ? '32' : '24'}px;
      font-weight: bold;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo logo-text">VelocityMaid New Jersey</div>
    <h1 class="title">Transparent Pricing</h1>
    <div class="pricing-grid">
      <div class="price-card">
        <h3>1 Bedroom</h3>
        <div class="price">$120</div>
        <p style="font-size: ${width === 1080 ? '20' : '16'}px;">Standard Clean</p>
      </div>
      <div class="price-card">
        <h3>2 Bedroom</h3>
        <div class="price">$150</div>
        <p style="font-size: ${width === 1080 ? '20' : '16'}px;">Standard Clean</p>
      </div>
      <div class="price-card">
        <h3>3 Bedroom</h3>
        <div class="price">$180</div>
        <p style="font-size: ${width === 1080 ? '20' : '16'}px;">Standard Clean</p>
      </div>
    </div>
    <div class="cta">Book Now - 15% OFF First Clean</div>
  </div>
</body>
</html>
  `.trim();
}

function generateAnnouncementTemplate(width: number, height: number, baseStyles: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: linear-gradient(135deg, ${brandColors.accent} 0%, #F5B835 100%);
      color: ${brandColors.primary};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      text-align: center;
    }
    .logo-text {
      font-size: ${width === 1080 ? '64' : '48'}px;
      margin-bottom: 30px;
    }
    .announcement {
      font-size: ${width === 1080 ? '80' : '64'}px;
      font-weight: bold;
      margin: 30px 0;
    }
    .subtitle {
      font-size: ${width === 1080 ? '36' : '28'}px;
      margin: 20px 0;
    }
    .features {
      font-size: ${width === 1080 ? '28' : '22'}px;
      margin: 30px 0;
      line-height: 1.8;
    }
    .cta {
      background: ${brandColors.primary};
      color: ${brandColors.accent};
      padding: 25px 50px;
      border-radius: 8px;
      font-size: ${width === 1080 ? '36' : '28'}px;
      font-weight: bold;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo logo-text">VelocityMaid</div>
    <h1 class="announcement">New Jersey Now Open!</h1>
    <p class="subtitle">Professional Cleaning Services</p>
    <div class="features">
      ✓ Standard Cleaning<br>
      ✓ Deep Cleaning<br>
      ✓ Move In/Out<br>
      ✓ Recurring Service
    </div>
    <div class="cta">Book Your First Clean - 15% OFF</div>
  </div>
</body>
</html>
  `.trim();
}

function generateTestimonialTemplate(width: number, height: number, baseStyles: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: ${brandColors.white};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
    }
    .logo-text {
      font-size: ${width === 1080 ? '48' : '36'}px;
      color: ${brandColors.primary};
      margin-bottom: 40px;
    }
    .quote {
      font-size: ${width === 1080 ? '48' : '36'}px;
      font-style: italic;
      color: ${brandColors.primary};
      text-align: center;
      margin: 40px 0;
      line-height: 1.6;
    }
    .stars {
      color: ${brandColors.accent};
      font-size: ${width === 1080 ? '48' : '36'}px;
      margin: 20px 0;
    }
    .author {
      font-size: ${width === 1080 ? '32' : '24'}px;
      font-weight: bold;
      color: ${brandColors.primary};
      margin-top: 20px;
    }
    .location {
      font-size: ${width === 1080 ? '24' : '18'}px;
      color: #666;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo logo-text">VelocityMaid New Jersey</div>
    <div class="stars">★★★★★</div>
    <p class="quote">"VelocityMaid transformed my home! Professional, reliable, and spotless every time."</p>
    <div class="author">Sarah M.</div>
    <div class="location">New Jersey</div>
  </div>
</body>
</html>
  `.trim();
}

function generateRecruitmentTemplate(width: number, height: number, baseStyles: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: linear-gradient(135deg, ${brandColors.primary} 0%, #083025 100%);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
    }
    .logo-text {
      font-size: ${width === 1080 ? '64' : '48'}px;
      color: ${brandColors.accent};
      margin-bottom: 30px;
    }
    .title {
      font-size: ${width === 1080 ? '64' : '48'}px;
      font-weight: bold;
      margin: 30px 0;
    }
    .benefits {
      font-size: ${width === 1080 ? '32' : '24'}px;
      line-height: 2;
      margin: 30px 0;
      text-align: center;
    }
    .cta {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 25px 50px;
      border-radius: 8px;
      font-size: ${width === 1080 ? '36' : '28'}px;
      font-weight: bold;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo logo-text">VelocityMaid New Jersey</div>
    <h1 class="title">Join Our Team</h1>
    <div class="benefits">
      ✓ Competitive Pay<br>
      ✓ Flexible Schedule<br>
      ✓ Professional Training<br>
      ✓ Growth Opportunities
    </div>
    <div class="cta">Apply Now</div>
  </div>
</body>
</html>
  `.trim();
}

function generateOpeningsTemplate(width: number, height: number, baseStyles: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: ${brandColors.white};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
    }
    .header {
      background: ${brandColors.primary};
      color: white;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      width: 100%;
      margin-bottom: 40px;
    }
    .logo-text {
      font-size: ${width === 1080 ? '56' : '42'}px;
      margin-bottom: 20px;
    }
    .title {
      font-size: ${width === 1080 ? '56' : '42'}px;
      font-weight: bold;
      color: ${brandColors.accent};
      margin: 0;
    }
    .openings {
      font-size: ${width === 1080 ? '36' : '28'}px;
      color: ${brandColors.primary};
      line-height: 2;
      margin: 30px 0;
    }
    .cta {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: 20px 40px;
      border-radius: 8px;
      font-size: ${width === 1080 ? '32' : '24'}px;
      font-weight: bold;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo logo-text">VelocityMaid New Jersey</div>
      <h1 class="title">Weekly Openings</h1>
    </div>
    <div class="openings">
      🗓️ Monday - Friday<br>
      🗓️ Saturday - Sunday<br>
      🗓️ Flexible Scheduling<br>
      🗓️ Part-time & Full-time
    </div>
    <div class="cta">Book Your Cleaning</div>
  </div>
</body>
</html>
  `.trim();
}

