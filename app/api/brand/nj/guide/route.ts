/**
 * VelocityMaid New Jersey Brand Style Guide Generator
 * GET /api/brand/nj/guide
 * 
 * Generates brand style guide as HTML (printable to PDF)
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
    const html = generateBrandGuide();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-brand-guide.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate brand guide error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate brand guide' },
      { status: 500 }
    );
  }
}

function generateBrandGuide(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Brand Style Guide</title>
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
      border-bottom: 4px solid ${brandColors.accent};
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
      color: ${brandColors.primary};
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .subtitle {
      font-size: 18px;
      color: ${brandColors.accent2};
      font-weight: 600;
      margin-top: 5px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 2px solid ${brandColors.neutral};
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
      border-bottom: 2px solid ${brandColors.neutral};
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
    .color-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .color-card {
      text-align: center;
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #ddd;
    }
    .color-swatch {
      width: 100%;
      height: 100px;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .font-example {
      margin: 20px 0;
      padding: 20px;
      background: ${brandColors.neutral};
      border-radius: 8px;
    }
    .logo-example {
      margin: 20px 0;
      padding: 30px;
      background: white;
      border: 2px solid ${brandColors.neutral};
      border-radius: 8px;
      text-align: center;
    }
    .tagline-box {
      background: ${brandColors.primary};
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .voice-example {
      background: ${brandColors.neutral};
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid ${brandColors.accent};
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">New Jersey Brand Style Guide</div>
        </div>
      </div>
    </div>
    <h1 style="text-align: center; font-size: 48px; margin-top: 100px;">
      Brand Style Guide
    </h1>
    <p style="text-align: center; font-size: 24px; color: #666; margin-top: 30px;">
      VelocityMaid New Jersey
    </p>
    <p style="text-align: center; font-size: 18px; color: #666; margin-top: 60px;">
      Version 1.0 • 2025
    </p>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Colors -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">New Jersey Brand Style Guide</div>
        </div>
      </div>
    </div>
    <h1>Brand Colors</h1>
    <div class="color-grid">
      <div class="color-card">
        <div class="color-swatch" style="background: ${brandColors.primary};"></div>
        <h3>Deep Green</h3>
        <p><strong>Primary</strong></p>
        <p>#0A3D2F</p>
        <p style="font-size: 12px;">Headers, text, backgrounds</p>
      </div>
      <div class="color-card">
        <div class="color-swatch" style="background: ${brandColors.accent};"></div>
        <h3>Gold</h3>
        <p><strong>Accent</strong></p>
        <p>#F8C548</p>
        <p style="font-size: 12px;">Highlights, CTAs, accents</p>
      </div>
      <div class="color-card">
        <div class="color-swatch" style="background: ${brandColors.accent2};"></div>
        <h3>Blue</h3>
        <p><strong>Accent 2</strong></p>
        <p>#2B70C9</p>
        <p style="font-size: 12px;">Links, secondary accents</p>
      </div>
      <div class="color-card">
        <div class="color-swatch" style="background: ${brandColors.neutral}; border: 2px solid #ddd;"></div>
        <h3>Beige</h3>
        <p><strong>Neutral</strong></p>
        <p>#F3F1EB</p>
        <p style="font-size: 12px;">Backgrounds, cards</p>
      </div>
    </div>
    <h2>Color Usage Guidelines</h2>
    <ul>
      <li><strong>Primary (Deep Green):</strong> Use for main headers, primary text, and key brand elements</li>
      <li><strong>Accent (Gold):</strong> Use for CTAs, highlights, and important callouts</li>
      <li><strong>Accent 2 (Blue):</strong> Use for links, secondary information, and supporting elements</li>
      <li><strong>Neutral (Beige):</strong> Use for backgrounds, cards, and subtle sections</li>
    </ul>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Typography -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">New Jersey Brand Style Guide</div>
        </div>
      </div>
    </div>
    <h1>Typography</h1>
    <h2>Headlines</h2>
    <div class="font-example">
      <p style="font-family: 'Montserrat', 'Poppins', Arial, sans-serif; font-size: 36px; font-weight: bold; color: ${brandColors.primary}; margin: 0;">
        Montserrat/Poppins Bold
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 10px;">
        Use for: Main headlines, page titles, hero text
      </p>
    </div>
    <h2>Body Text</h2>
    <div class="font-example">
      <p style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #333; margin: 0;">
        Inter Regular - This is the body text font used throughout all VelocityMaid New Jersey materials. 
        It provides excellent readability and maintains a professional appearance.
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 10px;">
        Use for: Body text, descriptions, paragraphs
      </p>
    </div>
    <h2>Font Sizes</h2>
    <ul>
      <li><strong>Hero/Display:</strong> 48-64px (Montserrat/Poppins Bold)</li>
      <li><strong>Headlines:</strong> 32-36px (Montserrat/Poppins Bold)</li>
      <li><strong>Subheadings:</strong> 24-28px (Montserrat/Poppins Bold)</li>
      <li><strong>Body:</strong> 14-18px (Inter Regular)</li>
      <li><strong>Small Text:</strong> 12-14px (Inter Regular)</li>
    </ul>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Logo Usage -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">New Jersey Brand Style Guide</div>
        </div>
      </div>
    </div>
    <h1>Logo Usage</h1>
    <h2>Main Logo</h2>
    <div class="logo-example">
      <div style="font-family: 'Montserrat', 'Poppins', Arial, sans-serif; font-size: 48px; font-weight: bold; color: ${brandColors.primary};">
        VelocityMaid
      </div>
      <div style="font-size: 24px; color: ${brandColors.primary}; margin-top: 10px;">
        New Jersey
      </div>
    </div>
    <h2>Logo Variations</h2>
    <ul>
      <li><strong>Full Logo:</strong> VelocityMaid + New Jersey (horizontal)</li>
      <li><strong>Badge Logo:</strong> Circular VM badge with "New Jersey"</li>
      <li><strong>Minimal Logo:</strong> VM initials only</li>
      <li><strong>Service Badge:</strong> Full service name on colored background</li>
    </ul>
    <h2>Logo Guidelines</h2>
    <ul>
      <li>Always maintain minimum clear space around logo (equal to height of "V" in VelocityMaid)</li>
      <li>Do not stretch or distort the logo</li>
      <li>Use on white or light backgrounds for best visibility</li>
      <li>On dark backgrounds, use white or gold version</li>
      <li>Minimum size: 100px width for digital, 1 inch for print</li>
    </ul>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Taglines -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">New Jersey Brand Style Guide</div>
        </div>
      </div>
    </div>
    <h1>Taglines & Messaging</h1>
    <h2>Primary Taglines</h2>
    <div class="tagline-box">
      <p style="font-size: 24px; font-weight: bold; margin: 0;">
        "Professional Cleaning Services"
      </p>
    </div>
    <div class="tagline-box" style="background: ${brandColors.accent}; color: ${brandColors.primary};">
      <p style="font-size: 24px; font-weight: bold; margin: 0;">
        "Reliable. Professional. Spotless."
      </p>
    </div>
    <h2>Supporting Messages</h2>
    <ul>
      <li>"Your trusted cleaning partner in New Jersey"</li>
      <li>"5-star quality, every time"</li>
      <li>"Insured, bonded, and satisfaction guaranteed"</li>
      <li>"Flexible scheduling to fit your life"</li>
    </ul>
    <h2>Value Propositions</h2>
    <ul>
      <li>Professional, trained cleaners</li>
      <li>Transparent pricing</li>
      <li>Consistent quality</li>
      <li>Flexible scheduling</li>
      <li>Satisfaction guaranteed</li>
    </ul>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Voice & Tone -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">New Jersey Brand Style Guide</div>
        </div>
      </div>
    </div>
    <h1>Voice & Tone Guidelines</h1>
    <h2>Brand Voice</h2>
    <p>VelocityMaid New Jersey communicates with a <strong>professional, friendly, and trustworthy</strong> voice.</p>
    <h2>Tone Characteristics</h2>
    <div class="voice-example">
      <p><strong>Professional:</strong> Use clear, concise language. Avoid slang or overly casual expressions.</p>
    </div>
    <div class="voice-example">
      <p><strong>Friendly:</strong> Warm and approachable, but not overly familiar. Show genuine care for customers.</p>
    </div>
    <div class="voice-example">
      <p><strong>Trustworthy:</strong> Be transparent about pricing, services, and policies. Build confidence through honesty.</p>
    </div>
    <h2>Do's and Don'ts</h2>
    <h3>Do:</h3>
    <ul>
      <li>Use clear, benefit-focused language</li>
      <li>Highlight professionalism and quality</li>
      <li>Be transparent about pricing and services</li>
      <li>Show appreciation for customers</li>
    </ul>
    <h3>Don't:</h3>
    <ul>
      <li>Use overly technical jargon</li>
      <li>Make promises you can't keep</li>
      <li>Use negative language about competitors</li>
      <li>Be overly salesy or pushy</li>
    </ul>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Photo Style -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">New Jersey Brand Style Guide</div>
        </div>
      </div>
    </div>
    <h1>Photo Style Guidelines</h1>
    <h2>Image Style</h2>
    <ul>
      <li><strong>Bright & Clean:</strong> Well-lit, natural lighting preferred</li>
      <li><strong>Professional:</strong> High-quality, clear images</li>
      <li><strong>Authentic:</strong> Real spaces, not overly staged</li>
      <li><strong>Consistent:</strong> Similar color grading and editing style</li>
    </ul>
    <h2>Before/After Photos</h2>
    <ul>
      <li>Use consistent angles and lighting</li>
      <li>Show clear transformation</li>
      <li>Include context (room type, service type)</li>
      <li>Maintain privacy (no personal items visible)</li>
    </ul>
    <h2>Team Photos</h2>
    <ul>
      <li>Professional, friendly appearance</li>
      <li>Uniform or branded clothing</li>
      <li>Natural, approachable poses</li>
      <li>Diverse representation</li>
    </ul>
    <h2>Service Area Photos</h2>
    <ul>
      <li>Show recognizable New Jersey landmarks or neighborhoods</li>
      <li>Clean, professional appearance</li>
      <li>Positive, welcoming atmosphere</li>
    </ul>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Social Layout Examples -->
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div>
          <div class="logo">VelocityMaid</div>
          <div class="subtitle">New Jersey Brand Style Guide</div>
        </div>
      </div>
    </div>
    <h1>Social Media Layout Examples</h1>
    <h2>Square Posts (1080x1080)</h2>
    <ul>
      <li>Use for: General posts, promotions, announcements</li>
      <li>Logo placement: Top center or bottom right</li>
      <li>Text: Keep concise, use large, readable fonts</li>
      <li>Colors: Use brand colors prominently</li>
    </ul>
    <h2>Story Posts (1080x1920)</h2>
    <ul>
      <li>Use for: Vertical content, behind-the-scenes, quick updates</li>
      <li>Logo placement: Top center (smaller size)</li>
      <li>Text: Large, bold, easy to read quickly</li>
      <li>Colors: High contrast for readability</li>
    </ul>
    <h2>Best Practices</h2>
    <ul>
      <li>Maintain consistent branding across all posts</li>
      <li>Use brand colors for CTAs and highlights</li>
      <li>Include logo on every post (can be subtle)</li>
      <li>Keep text minimal and impactful</li>
      <li>Use high-quality images</li>
      <li>Include clear call-to-action</li>
    </ul>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

