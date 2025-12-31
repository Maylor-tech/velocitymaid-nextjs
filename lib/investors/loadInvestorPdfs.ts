/**
 * Load Investor PDFs for Email Attachments
 * 
 * Loads PDF files from private/investor-materials/ directory
 * and converts them to base64-encoded attachments for Resend emails.
 * 
 * Files are server-only and not web-accessible.
 */

import fs from "fs";
import path from "path";

export type PdfAttachment = {
  filename: string;
  content: string;
};

/**
 * Load investor PDFs from private directory
 * Returns empty array if directory/files don't exist (graceful degradation)
 */
export function loadInvestorPdfs(): PdfAttachment[] {
  const basePath = path.join(
    process.cwd(),
    "private",
    "investor-materials"
  );

  // Check if directory exists
  if (!fs.existsSync(basePath)) {
    console.warn(
      `[INVESTOR_PDFS] Directory not found: ${basePath}. PDFs will not be attached.`
    );
    return [];
  }

  const files = [
    {
      name: "Investor_Overview.pdf",
      path: "investor_overview.pdf",
    },
    {
      name: "Compliance_Risk_Readiness.pdf",
      path: "compliance_risk_summary.pdf",
    },
    {
      name: "Partner_Pilot_Proposal.pdf",
      path: "partner_pilot_proposal.pdf",
    },
    {
      name: "Governance_Architecture.pdf",
      path: "governance_architecture.pdf",
    },
  ];

  const attachments: PdfAttachment[] = [];

  for (const file of files) {
    const filePath = path.join(basePath, file.path);

    try {
      if (!fs.existsSync(filePath)) {
        console.warn(
          `[INVESTOR_PDFS] File not found: ${filePath}. Skipping.`
        );
        continue;
      }

      const buffer = fs.readFileSync(filePath);
      const base64Content = buffer.toString("base64");

      // Check file size (Resend recommends ~10MB max per email)
      const fileSizeMB = buffer.length / (1024 * 1024);
      if (fileSizeMB > 10) {
        console.warn(
          `[INVESTOR_PDFS] File ${file.name} is ${fileSizeMB.toFixed(2)}MB, exceeds 10MB limit. Skipping.`
        );
        continue;
      }

      attachments.push({
        filename: file.name,
        content: base64Content,
      });

      console.log(
        `[INVESTOR_PDFS] Loaded ${file.name} (${fileSizeMB.toFixed(2)}MB)`
      );
    } catch (error: any) {
      console.error(
        `[INVESTOR_PDFS] Failed to load ${file.name}:`,
        error.message
      );
      // Continue loading other files even if one fails
    }
  }

  return attachments;
}


