/**
 * VelocityMaid New Jersey Checklist Graphic (PNG)
 * GET /api/brand/nj/partners/checklist-graphic
 * 
 * Generates checklist graphic as HTML (printable to PNG)
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
    const html = generateChecklistGraphic();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-checklist-graphic.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate checklist graphic error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate checklist graphic' },
      { status: 500 }
    );
  }
}

function generateChecklistGraphic(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Checklist Graphic</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 1200px;
      height: 800px;
      font-family: 'Inter', Arial, sans-serif;
      background: ${brandColors.white};
    }
    .card {
      width: 100%;
      height: 100%;
      padding: 50px;
      background: ${brandColors.gray};
      display: flex;
      flex-direction: column;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      font-size: 56px;
      font-weight: bold;
      color: ${brandColors.primary};
      margin-bottom: 10px;
    }
    .title {
      font-size: 36px;
      font-weight: bold;
      color: ${brandColors.primary};
      margin: 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .checklist-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      flex: 1;
    }
    .checklist-column {
      background: white;
      padding: 30px;
      border-radius: 12px;
      border-left: 4px solid ${brandColors.accent};
    }
    .checklist-column h3 {
      font-size: 24px;
      color: ${brandColors.primary};
      margin: 0 0 20px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .checklist-item {
      display: flex;
      align-items: start;
      padding: 10px 0;
      font-size: 16px;
      border-bottom: 1px solid #eee;
    }
    .checklist-item:last-child {
      border-bottom: none;
    }
    .check {
      color: ${brandColors.accent};
      font-weight: bold;
      margin-right: 12px;
      font-size: 20px;
      flex-shrink: 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="title">Move-Out Cleaning Checklist</div>
    </div>
    <div class="checklist-grid">
      <div class="checklist-column">
        <h3>Kitchen</h3>
        <div class="checklist-item">
          <span class="check">✓</span>
          <span>Inside all cabinets</span>
        </div>
        <div class="checklist-item">
          <span class="check">✓</span>
          <span>Oven cleaned</span>
        </div>
        <div class="checklist-item">
          <span class="check">✓</span>
          <span>Refrigerator cleaned</span>
        </div>
        <div class="checklist-item">
          <span class="check">✓</span>
          <span>Dishwasher cleaned</span>
        </div>
        <div class="checklist-item">
          <span class="check">✓</span>
          <span>Countertops cleaned</span>
        </div>
      </div>
      <div class="checklist-column">
        <h3>Bathrooms</h3>
        <div class="checklist-item">
          <span class="check">✓</span>
          <span>Toilet cleaned</span>
        </div>
        <div class="checklist-item">
          <span class="check">✓</span>
          <span>Shower/Tub scrubbed</span>
        </div>
        <div class="checklist-item">
          <span class="check">✓</span>
          <span>Mirrors cleaned</span>
        </div>
        <div class="checklist-item">
          <span class="check">✓</span>
          <span>Floors sanitized</span>
        </div>
        <div class="checklist-item">
          <span class="check">✓</span>
          <span>Fixtures polished</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

