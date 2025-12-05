export const dynamic = 'force-dynamic'

/**
 * VelocityMaid New Jersey Building Partnership Contract
 * GET /api/brand/nj/partners/contract
 * 
 * Generates partnership contract as HTML (printable to PDF)
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
    const html = generateContract();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-nj-partnership-contract.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate contract error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate contract' },
      { status: 500 }
    );
  }
}

function generateContract(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid New Jersey - Building Partnership Contract</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }
    body {
      font-family: 'Inter', Arial, sans-serif;
      color: #333;
      line-height: 1.8;
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
    .logo {
      font-size: 36px;
      font-weight: bold;
      color: ${brandColors.primary};
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .subtitle {
      font-size: 18px;
      color: #2B70C9;
      font-weight: 600;
      margin-top: 5px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 2px solid ${brandColors.gray};
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
      text-align: center;
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
    .signature-section {
      margin: 40px 0;
      padding: 20px;
      border: 2px solid ${brandColors.gray};
      border-radius: 8px;
    }
    .signature-line {
      border-bottom: 2px solid #333;
      height: 50px;
      margin: 20px 0 10px 0;
      width: 100%;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h1>Building Partnership Agreement</h1>
    <p style="text-align: center; font-size: 18px; color: #666; margin-top: 40px;">
      This agreement establishes a partnership between VelocityMaid New Jersey and the property 
      management company or apartment complex listed below.
    </p>
    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Agreement Terms -->
  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h2>1. Parties</h2>
    <p>
      <strong>Service Provider:</strong> VelocityMaid New Jersey<br>
      <strong>Property:</strong> [Property Name]<br>
      <strong>Property Manager:</strong> [Manager Name]<br>
      <strong>Effective Date:</strong> [Date]
    </p>

    <h2>2. Services Provided</h2>
    <p>VelocityMaid agrees to provide the following cleaning services:</p>
    <ul>
      <li>Move-in cleaning for new residents</li>
      <li>Move-out cleaning for departing residents</li>
      <li>Recurring cleaning services (as requested)</li>
      <li>Emergency cleaning services (as available)</li>
    </ul>

    <h2>3. Pricing and Payment</h2>
    <p>Partnership pricing applies to all services:</p>
    <ul>
      <li>Move-in/Move-out cleaning: Partnership rates as specified in pricing sheet</li>
      <li>Recurring cleaning: 15% discount on standard rates</li>
      <li>Volume discounts: Additional discounts for 50+ units or guaranteed monthly volume</li>
      <li>Payment terms: Net 30 days or as otherwise agreed</li>
    </ul>

    <h2>4. Service Standards</h2>
    <p>VelocityMaid agrees to:</p>
    <ul>
      <li>Provide background-checked, insured cleaners</li>
      <li>Maintain consistent quality standards</li>
      <li>Complete all cleanings within agreed timeframes</li>
      <li>Provide 100% satisfaction guarantee</li>
      <li>Respond to issues within 24 hours</li>
    </ul>

    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Responsibilities -->
  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h2>5. Property Responsibilities</h2>
    <p>The Property agrees to:</p>
    <ul>
      <li>Provide access to apartments for cleaning</li>
      <li>Notify VelocityMaid of cleaning needs with reasonable advance notice</li>
      <li>Ensure apartments are accessible and safe for cleaners</li>
      <li>Pay invoices within agreed payment terms</li>
      <li>Provide feedback on service quality</li>
    </ul>

    <h2>6. Scheduling</h2>
    <p>
      Cleaning services will be scheduled based on property needs. VelocityMaid will make every 
      effort to accommodate requested dates and times. Priority scheduling is provided to partnership 
      properties.
    </p>

    <h2>7. Quality Assurance</h2>
    <p>
      VelocityMaid maintains high quality standards. If any cleaning does not meet our standards, 
      we will return to fix it at no additional charge within 24 hours of notification.
    </p>

    <h2>8. Insurance and Liability</h2>
    <p>
      VelocityMaid maintains general liability insurance and workers' compensation insurance. 
      All cleaners are bonded and insured. VelocityMaid is responsible for any damage caused by 
      our cleaners during the course of service.
    </p>

    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Terms and Conditions -->
  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h2>9. Term and Termination</h2>
    <p>
      This agreement shall commence on the Effective Date and continue for an initial term of 
      [12 months], unless terminated earlier. Either party may terminate this agreement with 
      30 days written notice.
    </p>

    <h2>10. Confidentiality</h2>
    <p>
      Both parties agree to maintain confidentiality of any proprietary information shared during 
      the course of this partnership.
    </p>

    <h2>11. Dispute Resolution</h2>
    <p>
      Any disputes arising from this agreement shall be resolved through good faith negotiation. 
      If unable to resolve, disputes shall be subject to binding arbitration in New Jersey.
    </p>

    <h2>12. General Provisions</h2>
    <ul>
      <li>This agreement constitutes the entire agreement between the parties</li>
      <li>Modifications must be in writing and signed by both parties</li>
      <li>This agreement is governed by New Jersey law</li>
      <li>If any provision is found unenforceable, the remainder shall remain in effect</li>
    </ul>

    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>

  <!-- Signatures -->
  <div class="page">
    <div class="header">
      <div class="logo">VelocityMaid</div>
      <div class="subtitle">New Jersey</div>
    </div>
    <h2>Signatures</h2>
    <p>
      By signing below, both parties agree to the terms and conditions of this Building Partnership Agreement.
    </p>

    <div class="signature-section">
      <h3>VelocityMaid New Jersey</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
        <div>
          <div class="signature-line"></div>
          <p style="font-size: 12px; color: #666; margin: 0;">Authorized Signature</p>
        </div>
        <div>
          <div class="signature-line"></div>
          <p style="font-size: 12px; color: #666; margin: 0;">Date</p>
        </div>
      </div>
      <div style="margin-top: 20px;">
        <div class="signature-line"></div>
        <p style="font-size: 12px; color: #666; margin: 0;">Print Name</p>
      </div>
      <div style="margin-top: 20px;">
        <div class="signature-line"></div>
        <p style="font-size: 12px; color: #666; margin: 0;">Title</p>
      </div>
    </div>

    <div class="signature-section" style="margin-top: 40px;">
      <h3>Property Management Company</h3>
      <div style="margin-top: 20px;">
        <div class="signature-line"></div>
        <p style="font-size: 12px; color: #666; margin: 0;">Property Name</p>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
        <div>
          <div class="signature-line"></div>
          <p style="font-size: 12px; color: #666; margin: 0;">Authorized Signature</p>
        </div>
        <div>
          <div class="signature-line"></div>
          <p style="font-size: 12px; color: #666; margin: 0;">Date</p>
        </div>
      </div>
      <div style="margin-top: 20px;">
        <div class="signature-line"></div>
        <p style="font-size: 12px; color: #666; margin: 0;">Print Name</p>
      </div>
      <div style="margin-top: 20px;">
        <div class="signature-line"></div>
        <p style="font-size: 12px; color: #666; margin: 0;">Title</p>
      </div>
    </div>

    <div class="footer">
      <p>VelocityMaid New Jersey • © 2025</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

