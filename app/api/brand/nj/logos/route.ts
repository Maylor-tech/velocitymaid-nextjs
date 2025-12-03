/**
 * VelocityMaid New Jersey Logo Generator
 * GET /api/brand/nj/logos?type={logoType}
 * 
 * Generates SVG logos for New Jersey brand
 */

import { NextRequest, NextResponse } from 'next/server';

const brandColors = {
  primary: '#0A3D2F',
  accent: '#F8C548',
  white: '#FFFFFF',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'main';

    let svg = '';

    switch (type) {
      case 'main':
        svg = generateMainLogo();
        break;
      case 'horizontal':
        svg = generateHorizontalLogo();
        break;
      case 'badge':
        svg = generateBadgeLogo();
        break;
      case 'minimal':
        svg = generateMinimalLogo();
        break;
      case 'service-badge':
        svg = generateServiceBadge();
        break;
      default:
        svg = generateMainLogo();
    }

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `inline; filename="velocitymaid-nj-${type}.svg"`,
      },
    });
  } catch (error: any) {
    console.error('Generate logo error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate logo' },
      { status: 500 }
    );
  }
}

function generateMainLogo(): string {
  return `
<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F8C548;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F5B835;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="200" fill="${brandColors.white}"/>
  <g transform="translate(50, 40)">
    <rect x="0" y="0" width="60" height="60" rx="8" fill="${brandColors.accent}"/>
    <text x="30" y="42" font-family="Montserrat, Arial, sans-serif" font-size="32" font-weight="bold" fill="${brandColors.primary}" text-anchor="middle">VM</text>
  </g>
  <text x="130" y="70" font-family="Montserrat, Arial, sans-serif" font-size="36" font-weight="bold" fill="${brandColors.primary}">VelocityMaid</text>
  <text x="130" y="100" font-family="Inter, Arial, sans-serif" font-size="18" fill="${brandColors.primary}">New Jersey</text>
  <line x1="130" y1="110" x2="350" y2="110" stroke="${brandColors.accent}" stroke-width="3"/>
</svg>
  `.trim();
}

function generateHorizontalLogo(): string {
  return `
<svg width="500" height="120" xmlns="http://www.w3.org/2000/svg">
  <rect width="500" height="120" fill="${brandColors.white}"/>
  <g transform="translate(30, 30)">
    <rect x="0" y="0" width="60" height="60" rx="8" fill="${brandColors.accent}"/>
    <text x="30" y="42" font-family="Montserrat, Arial, sans-serif" font-size="32" font-weight="bold" fill="${brandColors.primary}" text-anchor="middle">VM</text>
  </g>
  <text x="110" y="55" font-family="Montserrat, Arial, sans-serif" font-size="32" font-weight="bold" fill="${brandColors.primary}">VelocityMaid</text>
  <text x="110" y="80" font-family="Inter, Arial, sans-serif" font-size="16" fill="${brandColors.primary}">New Jersey</text>
</svg>
  `.trim();
}

function generateBadgeLogo(): string {
  return `
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F8C548;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F5B835;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="90" fill="url(#badgeGradient)" stroke="${brandColors.primary}" stroke-width="4"/>
  <text x="100" y="75" font-family="Montserrat, Arial, sans-serif" font-size="48" font-weight="bold" fill="${brandColors.primary}" text-anchor="middle">VM</text>
  <text x="100" y="110" font-family="Inter, Arial, sans-serif" font-size="14" fill="${brandColors.primary}" text-anchor="middle">New Jersey</text>
  <text x="100" y="130" font-family="Inter, Arial, sans-serif" font-size="12" fill="${brandColors.primary}" text-anchor="middle">Professional Cleaning</text>
</svg>
  `.trim();
}

function generateMinimalLogo(): string {
  return `
<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
  <rect width="120" height="120" rx="12" fill="${brandColors.accent}"/>
  <text x="60" y="75" font-family="Montserrat, Arial, sans-serif" font-size="48" font-weight="bold" fill="${brandColors.primary}" text-anchor="middle">VM</text>
</svg>
  `.trim();
}

function generateServiceBadge(): string {
  return `
<svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="100" rx="8" fill="${brandColors.primary}"/>
  <text x="150" y="40" font-family="Montserrat, Arial, sans-serif" font-size="24" font-weight="bold" fill="${brandColors.accent}" text-anchor="middle">VelocityMaid</text>
  <text x="150" y="65" font-family="Inter, Arial, sans-serif" font-size="16" fill="${brandColors.accent}" text-anchor="middle">New Jersey</text>
  <text x="150" y="85" font-family="Inter, Arial, sans-serif" font-size="12" fill="${brandColors.white}" text-anchor="middle">Professional Cleaning Services</text>
</svg>
  `.trim();
}

