/**
 * Phase 3G: Cleaner Payout Statement (PDF)
 * 
 * GET /api/cleaner/statements/[transferId]
 * 
 * Generates a PDF statement for a PAID payout transfer (read-only)
 * 
 * Security:
 * - Only accessible by the cleaner who owns the transfer
 * - Only generates for PAID transfers
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { PayoutTransferStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { transferId: string } }
) {
  try {
    // Authenticate cleaner and get cleanerId
    const auth = await requireRole(request, "CLEANER");
    const cleanerId = auth.userId;
    const { transferId } = params;

    // Fetch transfer with all related data
    const transfer = await prisma.payoutTransfer.findUnique({
      where: { id: transferId },
      include: {
        cleaner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        batch: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
            status: true,
            createdAt: true,
          },
        },
        ledgerEntries: {
          select: {
            id: true,
            jobId: true,
            type: true,
            amountCents: true,
            description: true,
            createdAt: true,
            job: {
              select: {
                id: true,
                customerName: true,
                address: true,
                serviceType: true,
                completedAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { success: false, error: "Payout transfer not found" },
        { status: 404 }
      );
    }

    // Security: Verify transfer belongs to this cleaner
    if (transfer.cleanerId !== cleanerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: This payout does not belong to you" },
        { status: 403 }
      );
    }

    // Only generate PDF for PAID transfers
    if (transfer.status !== PayoutTransferStatus.PAID) {
      return NextResponse.json(
        {
          success: false,
          error: `Statement only available for PAID transfers. Current status: ${transfer.status}`,
        },
        { status: 400 }
      );
    }

    // Generate HTML for PDF
    const html = generateStatementHTML(transfer);

    // Return HTML (can be printed to PDF or converted server-side)
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="payout-statement-${transferId}.html"`,
      },
    });
  } catch (error: any) {
    console.error("[CLEANER_STATEMENT_PDF] Error:", error);

    // Handle auth errors
    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate payout statement",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Generate HTML for payout statement PDF
 */
function generateStatementHTML(transfer: any): string {
  const amount = (transfer.amountCents / 100).toFixed(2);
  const periodStart = transfer.batch.periodStart.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const periodEnd = transfer.batch.periodEnd.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const paidDate = transfer.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate totals from ledger entries
  const totalFromLedger = transfer.ledgerEntries.reduce(
    (sum: number, entry: any) => sum + entry.amountCents,
    0
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payout Statement - ${transfer.id}</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #1e40af;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 18px;
      color: #6b7280;
    }
    .statement-title {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
      margin: 30px 0 20px 0;
      text-align: center;
    }
    .info-section {
      margin-bottom: 30px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .info-item {
      margin-bottom: 10px;
    }
    .info-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }
    .amount-box {
      background: #f0f9ff;
      border: 2px solid #1e40af;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    .amount-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .amount-value {
      font-size: 36px;
      font-weight: bold;
      color: #059669;
    }
    .ledger-section {
      margin-top: 40px;
    }
    .ledger-title {
      font-size: 18px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .ledger-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .ledger-table th {
      background: #f9fafb;
      text-align: left;
      padding: 12px;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      border-bottom: 2px solid #e5e7eb;
    }
    .ledger-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .ledger-table tr:hover {
      background: #f9fafb;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      background: #d1fae5;
      color: #065f46;
    }
    .note {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      font-size: 13px;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">VelocityMaid</div>
    <div class="subtitle">Payout Statement</div>
  </div>

  <div class="statement-title">Payout Statement</div>

  <div class="info-section">
    <div class="info-grid">
      <div>
        <div class="info-item">
          <div class="info-label">Statement ID</div>
          <div class="info-value">${transfer.id}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Batch ID</div>
          <div class="info-value">${transfer.batch.id}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Period</div>
          <div class="info-value">${periodStart} - ${periodEnd}</div>
        </div>
      </div>
      <div>
        <div class="info-item">
          <div class="info-label">Cleaner</div>
          <div class="info-value">${transfer.cleaner.name || transfer.cleaner.email}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Status</div>
          <div class="info-value">
            <span class="status-badge">${transfer.status}</span>
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Paid Date</div>
          <div class="info-value">${paidDate}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Total Payout Amount</div>
    <div class="amount-value">$${amount}</div>
    <div style="font-size: 12px; color: #6b7280; margin-top: 8px;">
      Currency: ${transfer.currency}
    </div>
  </div>

  ${transfer.stripePayoutId ? `
    <div class="info-item">
      <div class="info-label">Stripe Payout ID</div>
      <div class="info-value" style="font-family: monospace; font-size: 14px;">${transfer.stripePayoutId}</div>
    </div>
  ` : ""}

  ${transfer.ledgerEntries.length > 0 ? `
    <div class="ledger-section">
      <div class="ledger-title">Earnings Breakdown</div>
      <table class="ledger-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Job ID</th>
            <th>Customer</th>
            <th>Service</th>
            <th>Description</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${transfer.ledgerEntries.map((entry: any) => {
            const entryDate = entry.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const entryAmount = (entry.amountCents / 100).toFixed(2);
            return `
              <tr>
                <td>${entryDate}</td>
                <td style="font-family: monospace; font-size: 12px;">${entry.jobId || "N/A"}</td>
                <td>${entry.job?.customerName || "N/A"}</td>
                <td>${entry.job?.serviceType || "N/A"}</td>
                <td>${entry.description || "Earnings from completed job"}</td>
                <td class="text-right">$${entryAmount}</td>
              </tr>
            `;
          }).join("")}
          <tr style="background: #f9fafb; font-weight: 600;">
            <td colspan="5" class="text-right">Total:</td>
            <td class="text-right">$${(totalFromLedger / 100).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  ` : ""}

  <div class="note">
    <strong>Note:</strong> This statement reflects earnings that have been processed and paid out. 
    All amounts are in ${transfer.currency}. For questions or discrepancies, please contact support.
  </div>

  <div class="footer">
    <p>VelocityMaid Payout Statement</p>
    <p>Generated on ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}</p>
    <p>Statement ID: ${transfer.id}</p>
  </div>
</body>
</html>`;
}


