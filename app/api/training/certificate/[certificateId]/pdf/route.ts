/**
 * Generate Certificate PDF API
 * GET /api/training/certificate/[certificateId]/pdf
 * 
 * Generates and returns a PDF of the certificate
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { certificateId: string } }
) {
  try {
    const cookieStore = await cookies();
    const cleanerId = cookieStore.get('cleanerId')?.value;

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { certificateId } = params;

    const certificate = await prisma.trainingCertificate.findUnique({
      where: { certificateId },
      include: {
        cleaner: {
          include: {
            primaryBranch: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Verify certificate belongs to authenticated cleaner
    if (certificate.cleanerId !== cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // For now, return HTML that can be printed to PDF
    // In production, use a PDF library like @react-pdf/renderer or puppeteer
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://velocitymaid.com';
    const verificationUrl = `${baseUrl}/verify/certificate/${certificateId}`;
    const issuedDate = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Generate HTML for PDF (can be converted to PDF using browser print or library)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid Certificate - ${certificate.certificateId}</title>
  <style>
    @page {
      size: letter landscape;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 60px;
      font-family: 'Times New Roman', serif;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
    }
    .certificate {
      background: white;
      border: 8px solid #fbbf24;
      border-radius: 20px;
      padding: 60px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .logo {
      font-size: 48px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 24px;
      color: #4b5563;
      margin-bottom: 40px;
    }
    .award-icon {
      font-size: 80px;
      color: #f59e0b;
      margin: 30px 0;
    }
    .title {
      font-size: 36px;
      font-weight: bold;
      color: #111827;
      margin-bottom: 10px;
    }
    .subtitle-text {
      font-size: 20px;
      color: #6b7280;
      margin-bottom: 40px;
    }
    .recipient-section {
      border-top: 3px solid #d1d5db;
      border-bottom: 3px solid #d1d5db;
      padding: 40px 0;
      margin: 40px 0;
    }
    .certifies {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .name {
      font-size: 48px;
      font-weight: bold;
      color: #1e3a8a;
      margin: 20px 0;
    }
    .completion-text {
      font-size: 18px;
      color: #6b7280;
      margin: 10px 0;
    }
    .details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      max-width: 600px;
      margin: 40px auto;
      text-align: left;
    }
    .detail-item {
      margin-bottom: 15px;
    }
    .detail-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .detail-value {
      font-size: 18px;
      font-weight: bold;
      color: #111827;
    }
    .certificate-id {
      font-family: monospace;
      font-size: 16px;
    }
    .verification {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .verification-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .verification-url {
      font-size: 12px;
      font-family: monospace;
      color: #2563eb;
      word-break: break-all;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-top: 2px solid #9ca3af;
      margin-bottom: 10px;
      height: 60px;
    }
    .signature-label {
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="logo">VelocityMaid</div>
    <div class="subtitle">Jamaica Branch</div>
    
    <div class="award-icon">🏆</div>
    
    <div class="title">Certificate of Completion</div>
    <div class="subtitle-text">Professional Cleaning Training Program</div>
    
    <div class="recipient-section">
      <div class="certifies">This is to certify that</div>
      <div class="name">${certificate.cleaner.name || 'Unknown'}</div>
      <div class="completion-text">has successfully completed</div>
      <div class="completion-text" style="font-weight: bold; font-size: 20px; margin-top: 15px;">
        All Required Training Modules
      </div>
      <div class="completion-text">for VelocityMaid Jamaica Operations</div>
    </div>
    
    <div class="details">
      <div class="detail-item">
        <div class="detail-label">Branch</div>
        <div class="detail-value">${certificate.cleaner.primaryBranch?.name || 'Unknown'}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Date Issued</div>
        <div class="detail-value">${issuedDate}</div>
      </div>
      <div class="detail-item" style="grid-column: 1 / -1;">
        <div class="detail-label">Certificate ID</div>
        <div class="detail-value certificate-id">${certificate.certificateId}</div>
      </div>
    </div>
    
    <div class="verification">
      <div class="verification-label">Verify this certificate at:</div>
      <div class="verification-url">${verificationUrl}</div>
    </div>
    
    <div class="signatures">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Training Manager</div>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Date</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Return HTML (can be converted to PDF using browser print or a PDF library)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="certificate-${certificateId}.html"`,
      },
    });
  } catch (error: any) {
    console.error('Generate PDF error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}


