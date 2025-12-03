/**
 * Generate Cleaner Handbook PDF API
 * GET /api/training/handbook/pdf
 * 
 * Generates and returns a PDF of the Jamaica Cleaner Handbook
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cleanerId = cookieStore.get('cleanerId')?.value;

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if cleaner has certification
    const trainingStatus = await prisma.trainingStatus.findUnique({
      where: { cleanerId },
    });

    if (!trainingStatus || trainingStatus.overallStatus !== 'PASSED') {
      return NextResponse.json(
        { success: false, error: 'Training must be completed to access handbook' },
        { status: 403 }
      );
    }

    // SOP Content
    const sopSections = [
      {
        title: 'House Cleaning',
        content: [
          'Start with high surfaces and work downward (dust ceiling fans, then counters, then floors)',
          'Use appropriate cleaning products for each surface type',
          'Clean all rooms systematically: bedrooms, bathrooms, kitchen, living areas',
          'Empty trash bins and replace liners',
          'Wipe down all surfaces including countertops, tables, and shelves',
          'Clean mirrors and windows in each room',
          'Vacuum carpets and mop hard floors',
          'Ensure all cleaning supplies are properly stored after use',
          'Check for any missed areas before completing',
          'Report any damages or issues to supervisor immediately',
        ],
      },
      {
        title: 'Deep Clean',
        content: [
          'Move furniture to clean underneath (with customer permission)',
          'Clean baseboards and trim throughout the property',
          'Deep clean inside ovens, refrigerators, and microwaves',
          'Scrub grout lines in bathrooms and kitchens',
          'Clean inside cabinets and drawers',
          'Wash window sills and tracks',
          'Clean light fixtures and ceiling fans thoroughly',
          'Deep clean carpets with appropriate equipment',
          'Sanitize all high-touch surfaces',
          'Clean behind and under appliances',
          'Polish fixtures and hardware',
          'Complete detailed inspection checklist',
        ],
      },
      {
        title: 'Airbnb Turnover',
        content: [
          'Arrive on time - turnover windows are critical',
          'Strip all bed linens and replace with fresh sets',
          'Check inventory of towels, toilet paper, and amenities',
          'Clean and sanitize all bathrooms thoroughly',
          'Wipe down all surfaces in kitchen and living areas',
          'Vacuum and mop all floors',
          'Check and restock welcome basket if applicable',
          'Ensure all appliances are clean and functional',
          'Check for any guest items left behind',
          'Verify all lights and electronics are working',
          'Take photos of completed work if required',
          'Lock up and secure property properly',
          'Report completion to supervisor immediately',
        ],
      },
      {
        title: 'Laundry',
        content: [
          'Sort laundry by color and fabric type',
          'Check all pockets before washing',
          'Use appropriate water temperature for each load',
          'Use correct amount of detergent and fabric softener',
          'Follow care labels on all garments',
          'Dry items according to fabric requirements',
          'Fold or hang items immediately after drying',
          'Iron items that require pressing',
          'Return clean items to designated areas',
          'Handle delicate items with extra care',
          'Report any damaged or stained items',
          'Maintain cleanliness of laundry area',
        ],
      },
      {
        title: 'Safety',
        content: [
          'Always wear appropriate personal protective equipment (PPE)',
          'Use cleaning chemicals according to manufacturer instructions',
          'Never mix cleaning chemicals',
          'Ensure proper ventilation when using strong chemicals',
          'Report any safety hazards immediately',
          'Use ladders safely and with proper support',
          'Keep cleaning supplies out of reach of children and pets',
          'Wash hands frequently, especially after handling chemicals',
          'Store chemicals in original containers with labels',
          'Know location of first aid kit and emergency contacts',
          'Follow proper lifting techniques to avoid injury',
          'Report any injuries, no matter how minor',
          'Stay hydrated and take breaks as needed',
        ],
      },
      {
        title: 'Conduct',
        content: [
          'Arrive on time and in proper uniform',
          'Maintain professional appearance at all times',
          'Respect customer property and privacy',
          'Communicate clearly and professionally with customers',
          'Follow all instructions from supervisors',
          'Complete all assigned tasks thoroughly',
          'Report any issues or concerns promptly',
          'Maintain confidentiality about customer information',
          'Do not use customer facilities (bathroom, phone) without permission',
          'Do not take photos or videos without authorization',
          'Do not accept tips directly - report to supervisor',
          'Treat all customers and colleagues with respect',
          'Follow company policies and procedures at all times',
        ],
      },
    ];

    // Generate HTML for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid Jamaica Cleaner Handbook</title>
  <style>
    @page {
      size: letter;
      margin: 1in;
    }
    body {
      font-family: 'Times New Roman', serif;
      line-height: 1.6;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #1e40af;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 36px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 20px;
      color: #4b5563;
    }
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .section-content {
      margin-left: 20px;
    }
    .section-content ol {
      margin: 0;
      padding-left: 25px;
    }
    .section-content li {
      margin-bottom: 10px;
      line-height: 1.8;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    .intro {
      margin-bottom: 40px;
      padding: 20px;
      background: #f0f9ff;
      border-left: 4px solid #1e40af;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">VelocityMaid</div>
    <div class="subtitle">Jamaica Cleaner Handbook</div>
    <div style="font-size: 14px; color: #6b7280; margin-top: 10px;">
      Standard Operating Procedures & Guidelines
    </div>
  </div>

  <div class="intro">
    <p><strong>Welcome to VelocityMaid Jamaica!</strong></p>
    <p>This handbook contains the Standard Operating Procedures (SOPs) for all cleaning services. 
    Please review these procedures carefully and follow them on every job. These guidelines ensure 
    consistent quality, safety, and professionalism in all our work.</p>
  </div>

  ${sopSections.map((section) => `
    <div class="section">
      <div class="section-title">${section.title}</div>
      <div class="section-content">
        <ol>
          ${section.content.map((item) => `<li>${item}</li>`).join('')}
        </ol>
      </div>
    </div>
  `).join('')}

  <div class="footer">
    <p><strong>VelocityMaid Jamaica</strong></p>
    <p>For questions or clarifications, contact your supervisor or support@velocitymaid.com</p>
    <p style="margin-top: 10px;">© ${new Date().getFullYear()} VelocityMaid. All rights reserved.</p>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="VelocityMaid-Jamaica-Cleaner-Handbook.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate handbook PDF error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate handbook' },
      { status: 500 }
    );
  }
}

