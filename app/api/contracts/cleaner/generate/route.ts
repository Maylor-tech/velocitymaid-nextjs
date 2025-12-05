export const dynamic = 'force-dynamic';

/**
 * Generate Cleaner Agreement PDF
 * POST /api/contracts/cleaner/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanerAgreementTemplate } from '@/app/api/contracts/templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, cleanerId } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // Generate HTML for PDF
    const html = generateContractHTML(cleanerAgreementTemplate, {
      name,
      phone,
      email: email || '',
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    });

    // For now, return HTML (can be converted to PDF using browser print or library)
    // In production, upload to Supabase Storage and return URL
    const contractId = `cleaner-${Date.now()}`;
    const contractUrl = `/api/contracts/view/${contractId}`;

    // Save contract record
    await prisma.contract.create({
      data: {
        name,
        type: 'CLEANER',
        branch: 'port-antonio',
        url: contractUrl,
        status: 'PENDING',
        phone,
        email: email || null,
        metadata: {
          cleanerId: cleanerId || null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      contractId,
      url: contractUrl,
      html, // For immediate display
    });
  } catch (error: any) {
    console.error('Generate cleaner contract error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate contract' },
      { status: 500 }
    );
  }
}

function generateContractHTML(template: any, variables: any): string {
  const sectionsHTML = template.sections.map((section: any) => `
    <div style="margin-bottom: 25px;">
      <h3 style="font-size: 18px; font-weight: bold; color: #0A3D2F; margin-bottom: 10px; font-family: 'Montserrat', Arial, sans-serif;">
        ${section.title}
      </h3>
      <p style="font-size: 14px; line-height: 1.8; color: #333; margin: 0;">
        ${section.content}
      </p>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${template.title} - VelocityMaid Jamaica</title>
  <style>
    @page {
      size: letter;
      margin: 1in;
    }
    body {
      font-family: 'Inter', 'Arial', sans-serif;
      color: #333;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div style="border-bottom: 3px solid #F8C548; padding-bottom: 20px; margin-bottom: 30px;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
      <div>
        <h1 style="font-size: 32px; font-weight: bold; color: #0A3D2F; margin: 0; font-family: 'Montserrat', Arial, sans-serif;">
          VelocityMaid
        </h1>
        <p style="font-size: 16px; color: #2B70C9; margin: 5px 0 0 0; font-weight: 600;">
          Jamaica Branch
        </p>
      </div>
      <div style="width: 80px; height: 80px; background-color: #F8C548; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #0A3D2F; font-size: 24px; font-weight: bold;">
        VM
      </div>
    </div>
    <div style="border-top: 2px solid #F3F1EB; padding-top: 15px;">
      <h2 style="font-size: 24px; font-weight: bold; color: #0A3D2F; margin: 0; font-family: 'Montserrat', Arial, sans-serif;">
        ${template.title}
      </h2>
    </div>
  </div>

  <div style="margin-bottom: 30px; padding: 15px; background: #F3F1EB; border-radius: 8px;">
    <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${variables.name}</p>
    <p style="margin: 5px 0; font-size: 14px;"><strong>Phone:</strong> ${variables.phone}</p>
    ${variables.email ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${variables.email}</p>` : ''}
    <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${variables.date}</p>
  </div>

  ${sectionsHTML}

  <div style="margin-top: 60px; padding-top: 30px; border-top: 2px solid #F3F1EB;">
    <div style="margin-bottom: 40px;">
      <p style="font-size: 14px; margin-bottom: 50px;">By signing below, I acknowledge that I have read, understood, and agree to be bound by all terms and conditions of this Agreement.</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
        <div>
          <div style="border-bottom: 2px solid #333; height: 50px; margin-bottom: 10px;"></div>
          <p style="font-size: 12px; color: #666; margin: 0;">Cleaner Signature</p>
        </div>
        <div>
          <div style="border-bottom: 2px solid #333; height: 50px; margin-bottom: 10px;"></div>
          <p style="font-size: 12px; color: #666; margin: 0;">Date</p>
        </div>
      </div>
    </div>
    <div>
      <p style="font-size: 14px; margin-bottom: 50px;">VelocityMaid Jamaica Representative:</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
        <div>
          <div style="border-bottom: 2px solid #333; height: 50px; margin-bottom: 10px;"></div>
          <p style="font-size: 12px; color: #666; margin: 0;">Authorized Signature</p>
        </div>
        <div>
          <div style="border-bottom: 2px solid #333; height: 50px; margin-bottom: 10px;"></div>
          <p style="font-size: 12px; color: #666; margin: 0;">Date</p>
        </div>
      </div>
    </div>
  </div>

  <div style="margin-top: 60px; padding-top: 20px; border-top: 2px solid #F3F1EB; text-align: center; font-size: 12px; color: #6B7280;">
    <p style="margin: 5px 0; font-weight: 600; color: #0A3D2F;">VelocityMaid Jamaica • Port Antonio</p>
    <p style="margin: 5px 0;">WhatsApp: +1 (876) 555-1985</p>
    <p style="margin: 5px 0;">Website: https://velocitymaid.com</p>
    <p style="margin: 10px 0 0 0; font-size: 11px;">© 2025 Bornfidis Ecosystem</p>
  </div>
</body>
</html>
  `;
}

