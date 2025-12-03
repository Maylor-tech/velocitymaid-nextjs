/**
 * VelocityMaid New Jersey Instagram Content Pack Generator
 * GET /api/brand/nj/instagram?graphic={number}&format={feed|story}
 * 
 * Generates 30 Instagram graphics as HTML (printable to PNG)
 */

import { NextRequest, NextResponse } from 'next/server';

const brandColors = {
  primary: '#0A3D2F',
  accent: '#F8C548',
  white: '#FFFFFF',
  gray: '#F1F1F1',
};

const designSystem = {
  borderRadius: '20px',
  shadow: '0 8px 24px rgba(10, 61, 47, 0.15)',
  margin: '64px',
  headingFont: "'Montserrat', 'Poppins', Arial, sans-serif",
  bodyFont: "'Inter', Arial, sans-serif",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const graphic = parseInt(searchParams.get('graphic') || '1');
    const format = searchParams.get('format') || 'feed'; // feed or story

    const width = format === 'story' ? 1080 : 1080;
    const height = format === 'story' ? 1920 : 1080;

    const html = generateInstagramGraphic(graphic, width, height);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="velocitymaid-nj-instagram-${graphic}-${format}.html"`,
      },
    });
  } catch (error: any) {
    console.error('Generate Instagram graphic error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate graphic' },
      { status: 500 }
    );
  }
}

function generateInstagramGraphic(graphicNumber: number, width: number, height: number): string {
  const baseStyles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: ${width}px;
      height: ${height}px;
      font-family: ${designSystem.bodyFont};
      overflow: hidden;
      background: ${brandColors.white};
    }
    .container {
      width: ${width}px;
      height: ${height}px;
      position: relative;
      background: ${brandColors.white};
      padding: ${designSystem.margin};
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .logo {
      font-family: ${designSystem.headingFont};
      font-weight: bold;
      color: ${brandColors.primary};
    }
    .accent {
      color: ${brandColors.accent};
    }
    .card {
      background: ${brandColors.white};
      border-radius: ${designSystem.borderRadius};
      box-shadow: ${designSystem.shadow};
      padding: 40px;
    }
    h1 {
      font-family: ${designSystem.headingFont};
      font-weight: bold;
      color: ${brandColors.primary};
    }
    h2 {
      font-family: ${designSystem.headingFont};
      font-weight: bold;
      color: ${brandColors.primary};
    }
    p {
      font-family: ${designSystem.bodyFont};
      color: #333;
    }
  `;

  switch (graphicNumber) {
    case 1: return generateLaunchAnnouncement(width, height, baseStyles);
    case 2: return generatePricingChart(width, height, baseStyles);
    case 3: return generateCleaningChecklist(width, height, baseStyles);
    case 4: return generateSatisfactionGuarantee(width, height, baseStyles);
    case 5: return generateMeetYourCleaners(width, height, baseStyles);
    case 6: return generateBeforeAfterTemplate(width, height, baseStyles);
    case 7: return generateBookingSteps(width, height, baseStyles);
    case 8: return generateDeepCleaningBreakdown(width, height, baseStyles);
    case 9: return generateMoveInOutCleaning(width, height, baseStyles);
    case 10: return generateWeeklyCleaningPlan(width, height, baseStyles);
    case 11: return generateApartmentCleaning(width, height, baseStyles);
    case 12: return generatePetFriendlyCleaning(width, height, baseStyles);
    case 13: return generateSuppliesWeUse(width, height, baseStyles);
    case 14: return generateTestimonialTemplate(width, height, baseStyles);
    case 15: return generateServiceAreasMap(width, height, baseStyles);
    case 16: return generateWeeklyOpenings(width, height, baseStyles);
    case 17: return generateMoveOutPromo(width, height, baseStyles);
    case 18: return generateCleaningTipBathroom(width, height, baseStyles);
    case 19: return generateCleaningTipKitchen(width, height, baseStyles);
    case 20: return generateSeasonalCleanPromo(width, height, baseStyles);
    case 21: return generateReferralBonus(width, height, baseStyles);
    case 22: return generateBookNowCTA(width, height, baseStyles);
    case 23: return generateCleanerSpotlight(width, height, baseStyles);
    case 24: return generateGoogleReviewTemplate(width, height, baseStyles);
    case 25: return generateWhatsIncludedKitchen(width, height, baseStyles);
    case 26: return generateWhatsIncludedBathrooms(width, height, baseStyles);
    case 27: return generateWhatsIncludedBedrooms(width, height, baseStyles);
    case 28: return generateWhatsIncludedLivingRoom(width, height, baseStyles);
    case 29: return generateFlashSale(width, height, baseStyles);
    case 30: return generateMonthlySummary(width, height, baseStyles);
    default: return generateLaunchAnnouncement(width, height, baseStyles);
  }
}

// Graphic 1: NJ Launch Announcement
function generateLaunchAnnouncement(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
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
      text-align: center;
      justify-content: center;
      align-items: center;
    }
    .logo-text {
      font-size: ${isStory ? '64' : '72'}px;
      color: ${brandColors.accent};
      margin-bottom: 30px;
    }
    .announcement {
      font-size: ${isStory ? '56' : '64'}px;
      font-weight: bold;
      margin: 30px 0;
    }
    .subtitle {
      font-size: ${isStory ? '32' : '36'}px;
      margin: 20px 0;
    }
    .cta {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: ${isStory ? '20px 40px' : '25px 50px'};
      border-radius: ${designSystem.borderRadius};
      font-size: ${isStory ? '28' : '32'}px;
      font-weight: bold;
      margin-top: 40px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo logo-text">VelocityMaid</div>
    <h1 class="announcement">New Jersey Now Open!</h1>
    <p class="subtitle">Professional Cleaning Services</p>
    <div class="cta">Book Your First Clean - 15% OFF</div>
  </div>
</body>
</html>
  `.trim();
}

// Graphic 2: Pricing Chart
function generatePricingChart(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: ${brandColors.gray};
      justify-content: center;
      align-items: center;
    }
    .card {
      width: 100%;
      max-width: 900px;
    }
    h1 {
      font-size: ${isStory ? '48' : '56'}px;
      text-align: center;
      margin-bottom: 40px;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .price-card {
      background: ${brandColors.primary};
      color: white;
      padding: 30px;
      border-radius: ${designSystem.borderRadius};
      text-align: center;
      border: 3px solid ${brandColors.accent};
    }
    .price-card h3 {
      color: ${brandColors.accent};
      font-size: ${isStory ? '24' : '28'}px;
      margin-bottom: 15px;
    }
    .price {
      font-size: ${isStory ? '42' : '48'}px;
      font-weight: bold;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Transparent Pricing</h1>
      <div class="pricing-grid">
        <div class="price-card">
          <h3>1 Bedroom</h3>
          <div class="price">$120</div>
        </div>
        <div class="price-card">
          <h3>2 Bedroom</h3>
          <div class="price">$150</div>
        </div>
        <div class="price-card">
          <h3>3 Bedroom</h3>
          <div class="price">$180</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Graphic 3: Cleaning Checklist
function generateCleaningChecklist(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: ${brandColors.white};
    }
    h1 {
      font-size: ${isStory ? '48' : '56'}px;
      text-align: center;
      margin-bottom: 40px;
    }
    .checklist {
      background: ${brandColors.gray};
      padding: 40px;
      border-radius: ${designSystem.borderRadius};
    }
    .checklist-item {
      display: flex;
      align-items: center;
      padding: 20px;
      font-size: ${isStory ? '24' : '28'}px;
      margin: 10px 0;
      background: white;
      border-radius: 12px;
    }
    .check {
      color: ${brandColors.accent};
      font-size: ${isStory ? '32' : '36'}px;
      margin-right: 20px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Our Cleaning Checklist</h1>
    <div class="checklist">
      <div class="checklist-item">
        <span class="check">✓</span>
        <span>Dust all surfaces</span>
      </div>
      <div class="checklist-item">
        <span class="check">✓</span>
        <span>Vacuum & mop floors</span>
      </div>
      <div class="checklist-item">
        <span class="check">✓</span>
        <span>Clean & sanitize bathrooms</span>
      </div>
      <div class="checklist-item">
        <span class="check">✓</span>
        <span>Kitchen deep clean</span>
      </div>
      <div class="checklist-item">
        <span class="check">✓</span>
        <span>Trash removal</span>
      </div>
      <div class="checklist-item">
        <span class="check">✓</span>
        <span>Final inspection</span>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Graphic 4: Satisfaction Guarantee
function generateSatisfactionGuarantee(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
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
      text-align: center;
      justify-content: center;
      align-items: center;
    }
    .badge {
      font-size: ${isStory ? '120' : '140'}px;
      margin-bottom: 30px;
    }
    h1 {
      font-size: ${isStory ? '56' : '64'}px;
      margin: 30px 0;
    }
    .subtitle {
      font-size: ${isStory ? '32' : '36'}px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">✓</div>
    <h1>Satisfaction Guaranteed</h1>
    <p class="subtitle">Not happy? We'll come back and fix it - FREE</p>
  </div>
</body>
</html>
  `.trim();
}

// Graphic 5: Meet Your Cleaners
function generateMeetYourCleaners(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: ${brandColors.gray};
    }
    h1 {
      font-size: ${isStory ? '48' : '56'}px;
      text-align: center;
      margin-bottom: 40px;
    }
    .team-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .team-member {
      background: white;
      padding: 30px;
      border-radius: ${designSystem.borderRadius};
      text-align: center;
      box-shadow: ${designSystem.shadow};
    }
    .avatar {
      width: 120px;
      height: 120px;
      background: ${brandColors.primary};
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${brandColors.accent};
      font-size: 48px;
      font-weight: bold;
    }
    .team-member h3 {
      font-size: ${isStory ? '24' : '28'}px;
      color: ${brandColors.primary};
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Meet Your Cleaners</h1>
    <div class="team-grid">
      <div class="team-member">
        <div class="avatar">VM</div>
        <h3>Professional Team</h3>
        <p style="font-size: ${isStory ? '18' : '20'}px;">Trained & Certified</p>
      </div>
      <div class="team-member">
        <div class="avatar">VM</div>
        <h3>Insured & Bonded</h3>
        <p style="font-size: ${isStory ? '18' : '20'}px;">Your Peace of Mind</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Continue with remaining graphics... (I'll create a condensed version for the remaining 25 graphics)
// For brevity, I'll create the key ones and a pattern for the rest

// Graphic 6: Before/After Template
function generateBeforeAfterTemplate(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: ${brandColors.primary};
      color: white;
    }
    h1 {
      font-size: ${isStory ? '48' : '56'}px;
      text-align: center;
      margin-bottom: 40px;
      color: ${brandColors.accent};
    }
    .comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    .before, .after {
      background: rgba(255,255,255,0.1);
      padding: 40px;
      border-radius: ${designSystem.borderRadius};
      text-align: center;
    }
    .before h2, .after h2 {
      font-size: ${isStory ? '36' : '42'}px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Before & After</h1>
    <div class="comparison">
      <div class="before">
        <h2>Before</h2>
        <p style="font-size: ${isStory ? '24' : '28'}px;">Your space before</p>
      </div>
      <div class="after">
        <h2>After</h2>
        <p style="font-size: ${isStory ? '24' : '28'}px;">Spotless & refreshed</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// I'll create a helper function to generate the remaining graphics more efficiently
// Let me continue with a few more key ones and then create a pattern

// Graphic 7: Booking Steps
function generateBookingSteps(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: ${brandColors.gray};
    }
    h1 {
      font-size: ${isStory ? '48' : '56'}px;
      text-align: center;
      margin-bottom: 40px;
    }
    .steps {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .step {
      background: white;
      padding: 30px;
      border-radius: ${designSystem.borderRadius};
      text-align: center;
      box-shadow: ${designSystem.shadow};
    }
    .step-number {
      width: 60px;
      height: 60px;
      background: ${brandColors.primary};
      color: ${brandColors.accent};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${isStory ? '32' : '36'}px;
      font-weight: bold;
      margin: 0 auto 20px;
    }
    .step h3 {
      font-size: ${isStory ? '22' : '24'}px;
      color: ${brandColors.primary};
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Book in 3 Easy Steps</h1>
    <div class="steps">
      <div class="step">
        <div class="step-number">1</div>
        <h3>Choose Service</h3>
        <p style="font-size: ${isStory ? '18' : '20'}px;">Select your cleaning type</p>
      </div>
      <div class="step">
        <div class="step-number">2</div>
        <h3>Pick Date & Time</h3>
        <p style="font-size: ${isStory ? '18' : '20'}px;">Schedule at your convenience</p>
      </div>
      <div class="step">
        <div class="step-number">3</div>
        <h3>Relax & Enjoy</h3>
        <p style="font-size: ${isStory ? '18' : '20'}px;">We handle the rest</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Continue with template functions for remaining graphics...
// For space, I'll create a simplified version that generates all 30

// Remaining graphics will follow similar patterns. Let me create a comprehensive generator:
function generateDeepCleaningBreakdown(width: number, height: number, baseStyles: string): string {
  return generateGenericGraphic(width, height, baseStyles, 'Deep Cleaning Breakdown', ['Inside appliances', 'Baseboards & sills', 'Light fixtures', 'Cabinet interiors']);
}

function generateMoveInOutCleaning(width: number, height: number, baseStyles: string): string {
  return generateGenericGraphic(width, height, baseStyles, 'Move-In/Out Cleaning', ['Complete deep clean', 'Inside all cabinets', 'Appliance deep clean', 'Window cleaning']);
}

function generateWeeklyCleaningPlan(width: number, height: number, baseStyles: string): string {
  return generateGenericGraphic(width, height, baseStyles, 'Weekly Cleaning Plan', ['Save 10% with weekly service', 'Consistent schedule', 'Priority booking', 'Customized plan']);
}

function generateApartmentCleaning(width: number, height: number, baseStyles: string): string {
  return generateGenericGraphic(width, height, baseStyles, 'Apartment Cleaning', ['Perfect for apartments', 'Flexible scheduling', 'Affordable pricing', 'Satisfaction guaranteed']);
}

function generatePetFriendlyCleaning(width: number, height: number, baseStyles: string): string {
  return generateGenericGraphic(width, height, baseStyles, 'Pet-Friendly Cleaning', ['Safe for pets', 'Pet hair removal', 'Odor elimination', 'Pet-safe products']);
}

function generateSuppliesWeUse(width: number, height: number, baseStyles: string): string {
  return generateGenericGraphic(width, height, baseStyles, 'Supplies We Use', ['Eco-friendly products', 'Professional grade', 'Safe for families', 'Pet-friendly options']);
}

function generateTestimonialTemplate(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: ${brandColors.white};
      justify-content: center;
      align-items: center;
    }
    .card {
      width: 100%;
      max-width: 800px;
      text-align: center;
    }
    .stars {
      color: ${brandColors.accent};
      font-size: ${isStory ? '48' : '56'}px;
      margin-bottom: 30px;
    }
    .quote {
      font-size: ${isStory ? '32' : '36'}px;
      font-style: italic;
      color: ${brandColors.primary};
      margin: 30px 0;
      line-height: 1.6;
    }
    .author {
      font-size: ${isStory ? '28' : '32'}px;
      font-weight: bold;
      color: ${brandColors.primary};
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="stars">★★★★★</div>
      <p class="quote">"VelocityMaid transformed my home! Professional, reliable, and spotless every time."</p>
      <p class="author">- Sarah M., New Jersey</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateServiceAreasMap(width: number, height: number, baseStyles: string): string {
  return generateGenericGraphic(width, height, baseStyles, 'Service Areas', ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge']);
}

function generateWeeklyOpenings(width: number, height: number, baseStyles: string): string {
  return generateGenericGraphic(width, height, baseStyles, 'Weekly Openings', ['Monday - Friday', 'Saturday - Sunday', 'Flexible scheduling', 'Part-time & Full-time']);
}

function generateMoveOutPromo(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
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
      text-align: center;
      justify-content: center;
      align-items: center;
    }
    h1 {
      font-size: ${isStory ? '56' : '64'}px;
      margin: 30px 0;
    }
    .promo {
      font-size: ${isStory ? '72' : '80'}px;
      font-weight: bold;
      color: ${brandColors.accent};
      margin: 30px 0;
    }
    .subtitle {
      font-size: ${isStory ? '32' : '36'}px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Move-Out Special</h1>
    <div class="promo">20% OFF</div>
    <p class="subtitle">Complete move-out cleaning service</p>
  </div>
</body>
</html>
  `.trim();
}

function generateCleaningTipBathroom(width: number, height: number, baseStyles: string): string {
  return generateTipGraphic(width, height, baseStyles, 'Bathroom Cleaning Tip', 'Use a squeegee after every shower to prevent soap scum buildup!');
}

function generateCleaningTipKitchen(width: number, height: number, baseStyles: string): string {
  return generateTipGraphic(width, height, baseStyles, 'Kitchen Cleaning Tip', 'Clean your microwave by heating a bowl of water for 2 minutes - steam makes it easy!');
}

function generateSeasonalCleanPromo(width: number, height: number, baseStyles: string): string {
  return generateGenericGraphic(width, height, baseStyles, 'Seasonal Deep Clean', ['Spring cleaning special', '20% OFF', 'Complete home refresh', 'Book now']);
}

function generateReferralBonus(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      text-align: center;
      justify-content: center;
      align-items: center;
    }
    h1 {
      font-size: ${isStory ? '56' : '64'}px;
      margin: 30px 0;
    }
    .bonus {
      font-size: ${isStory ? '72' : '80'}px;
      font-weight: bold;
      margin: 30px 0;
    }
    .subtitle {
      font-size: ${isStory ? '28' : '32'}px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Refer a Friend</h1>
    <div class="bonus">$25 OFF</div>
    <p class="subtitle">You both get $25 off your next cleaning!</p>
  </div>
</body>
</html>
  `.trim();
}

function generateBookNowCTA(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
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
      text-align: center;
      justify-content: center;
      align-items: center;
    }
    .cta-button {
      background: ${brandColors.accent};
      color: ${brandColors.primary};
      padding: ${isStory ? '30px 60px' : '40px 80px'};
      border-radius: ${designSystem.borderRadius};
      font-size: ${isStory ? '48' : '56'}px;
      font-weight: bold;
      display: inline-block;
      box-shadow: ${designSystem.shadow};
    }
    h1 {
      font-size: ${isStory ? '48' : '56'}px;
      margin-bottom: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Ready for a Spotless Home?</h1>
    <div class="cta-button">Book Now</div>
  </div>
</body>
</html>
  `.trim();
}

function generateCleanerSpotlight(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: ${brandColors.gray};
      justify-content: center;
      align-items: center;
    }
    .card {
      width: 100%;
      max-width: 700px;
      text-align: center;
    }
    .avatar {
      width: 200px;
      height: 200px;
      background: ${brandColors.primary};
      border-radius: 50%;
      margin: 0 auto 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${brandColors.accent};
      font-size: 72px;
      font-weight: bold;
    }
    h1 {
      font-size: ${isStory ? '48' : '56'}px;
      margin-bottom: 20px;
    }
    h2 {
      font-size: ${isStory ? '36' : '42'}px;
      color: ${brandColors.primary};
      margin-bottom: 20px;
    }
    p {
      font-size: ${isStory ? '24' : '28'}px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Cleaner Spotlight</h1>
      <div class="avatar">VM</div>
      <h2>Professional Team</h2>
      <p>Trained, certified, and ready to serve you</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateGoogleReviewTemplate(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: white;
      justify-content: center;
      align-items: center;
    }
    .card {
      width: 100%;
      max-width: 800px;
      text-align: center;
    }
    .google-logo {
      font-size: ${isStory ? '48' : '56'}px;
      font-weight: bold;
      color: #4285F4;
      margin-bottom: 30px;
    }
    .stars {
      color: ${brandColors.accent};
      font-size: ${isStory ? '56' : '64'}px;
      margin-bottom: 30px;
    }
    h1 {
      font-size: ${isStory ? '48' : '56'}px;
      margin-bottom: 20px;
    }
    .cta {
      background: ${brandColors.primary};
      color: white;
      padding: 20px 40px;
      border-radius: ${designSystem.borderRadius};
      font-size: ${isStory ? '28' : '32'}px;
      font-weight: bold;
      display: inline-block;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="google-logo">Google</div>
      <div class="stars">★★★★★</div>
      <h1>Love Our Service?</h1>
      <p style="font-size: ${isStory ? '28' : '32'}px; margin: 20px 0;">Leave us a review!</p>
      <div class="cta">Review on Google</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateWhatsIncludedKitchen(width: number, height: number, baseStyles: string): string {
  return generateWhatsIncludedGraphic(width, height, baseStyles, 'Kitchen', ['Countertops', 'Appliances', 'Sink & faucet', 'Cabinets', 'Microwave', 'Stovetop']);
}

function generateWhatsIncludedBathrooms(width: number, height: number, baseStyles: string): string {
  return generateWhatsIncludedGraphic(width, height, baseStyles, 'Bathrooms', ['Toilet', 'Shower/Tub', 'Mirrors', 'Sink & counter', 'Floors', 'Fixtures']);
}

function generateWhatsIncludedBedrooms(width: number, height: number, baseStyles: string): string {
  return generateWhatsIncludedGraphic(width, height, baseStyles, 'Bedrooms', ['Dusting', 'Vacuuming', 'Bed making', 'Mirrors', 'Trash removal', 'Baseboards']);
}

function generateWhatsIncludedLivingRoom(width: number, height: number, baseStyles: string): string {
  return generateWhatsIncludedGraphic(width, height, baseStyles, 'Living Room', ['Dusting', 'Vacuuming', 'Furniture polish', 'Mirrors', 'Trash removal', 'Baseboards']);
}

function generateFlashSale(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
      color: white;
      text-align: center;
      justify-content: center;
      align-items: center;
    }
    .flash {
      font-size: ${isStory ? '64' : '72'}px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .sale {
      font-size: ${isStory ? '96' : '112'}px;
      font-weight: bold;
      margin: 30px 0;
    }
    .discount {
      font-size: ${isStory ? '72' : '80'}px;
      font-weight: bold;
      color: ${brandColors.accent};
      margin: 30px 0;
    }
    .subtitle {
      font-size: ${isStory ? '32' : '36'}px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="flash">⚡ FLASH SALE ⚡</div>
    <div class="sale">SALE</div>
    <div class="discount">30% OFF</div>
    <p class="subtitle">Limited time only - Book now!</p>
  </div>
</body>
</html>
  `.trim();
}

function generateMonthlySummary(width: number, height: number, baseStyles: string): string {
  const isStory = height > width;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: ${brandColors.gray};
    }
    h1 {
      font-size: ${isStory ? '48' : '56'}px;
      text-align: center;
      margin-bottom: 40px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .stat {
      background: white;
      padding: 30px;
      border-radius: ${designSystem.borderRadius};
      text-align: center;
      box-shadow: ${designSystem.shadow};
    }
    .stat-number {
      font-size: ${isStory ? '48' : '56'}px;
      font-weight: bold;
      color: ${brandColors.primary};
      margin-bottom: 10px;
    }
    .stat-label {
      font-size: ${isStory ? '22' : '24'}px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>This Month at VelocityMaid</h1>
    <div class="stats">
      <div class="stat">
        <div class="stat-number">150+</div>
        <div class="stat-label">Homes Cleaned</div>
      </div>
      <div class="stat">
        <div class="stat-number">98%</div>
        <div class="stat-label">Satisfaction Rate</div>
      </div>
      <div class="stat">
        <div class="stat-number">4.9★</div>
        <div class="stat-label">Average Rating</div>
      </div>
      <div class="stat">
        <div class="stat-number">50+</div>
        <div class="stat-label">Happy Customers</div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Helper functions for generic graphics
function generateGenericGraphic(width: number, height: number, baseStyles: string, title: string, items: string[]): string {
  const isStory = height > width;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: ${brandColors.gray};
    }
    h1 {
      font-size: ${isStory ? '48' : '56'}px;
      text-align: center;
      margin-bottom: 40px;
    }
    .items {
      background: white;
      padding: 40px;
      border-radius: ${designSystem.borderRadius};
      box-shadow: ${designSystem.shadow};
    }
    .item {
      display: flex;
      align-items: center;
      padding: 20px;
      font-size: ${isStory ? '24' : '28'}px;
      margin: 10px 0;
      background: ${brandColors.gray};
      border-radius: 12px;
    }
    .check {
      color: ${brandColors.accent};
      font-size: ${isStory ? '32' : '36'}px;
      margin-right: 20px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="items">
      ${items.map(item => `
        <div class="item">
          <span class="check">✓</span>
          <span>${item}</span>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateTipGraphic(width: number, height: number, baseStyles: string, title: string, tip: string): string {
  const isStory = height > width;
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
      text-align: center;
      justify-content: center;
      align-items: center;
    }
    .icon {
      font-size: ${isStory ? '96' : '112'}px;
      margin-bottom: 30px;
    }
    h1 {
      font-size: ${isStory ? '48' : '56'}px;
      margin: 30px 0;
    }
    .tip {
      font-size: ${isStory ? '32' : '36'}px;
      margin: 30px 0;
      line-height: 1.6;
      max-width: 800px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">💡</div>
    <h1>${title}</h1>
    <p class="tip">${tip}</p>
  </div>
</body>
</html>
  `.trim();
}

function generateWhatsIncludedGraphic(width: number, height: number, baseStyles: string, room: string, items: string[]): string {
  const isStory = height > width;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${baseStyles}
    .container {
      background: ${brandColors.gray};
    }
    h1 {
      font-size: ${isStory ? '48' : '56'}px;
      text-align: center;
      margin-bottom: 20px;
    }
    .room {
      font-size: ${isStory ? '36' : '42'}px;
      text-align: center;
      color: ${brandColors.primary};
      margin-bottom: 40px;
      font-weight: bold;
    }
    .items {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .item {
      background: white;
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      box-shadow: ${designSystem.shadow};
      font-size: ${isStory ? '22' : '24'}px;
      color: ${brandColors.primary};
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>What's Included</h1>
    <div class="room">${room}</div>
    <div class="items">
      ${items.map(item => `<div class="item">${item}</div>`).join('')}
    </div>
  </div>
</body>
</html>
  `.trim();
}

