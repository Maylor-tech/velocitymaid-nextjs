# Investor Materials Directory

This directory contains PDF files that are automatically attached to investor approval emails.

## File Structure

Place the following PDF files in this directory:

- `investor_overview.pdf` → Attached as `Investor_Overview.pdf`
- `compliance_risk_summary.pdf` → Attached as `Compliance_Risk_Readiness.pdf`
- `partner_pilot_proposal.pdf` → Attached as `Partner_Pilot_Proposal.pdf`
- `governance_architecture.pdf` → Attached as `Governance_Architecture.pdf`

## Security

- **This directory is NOT web-accessible** (not under `/public`)
- Files are loaded server-side only
- PDFs are base64-encoded before email attachment
- Maximum file size: 10MB per file (Resend limit)

## Usage

When an admin approves an investor access request:

1. System loads PDFs from this directory
2. Converts to base64-encoded attachments
3. Attaches to approval email via Resend
4. Sends email to approved investor

## Missing Files

If a PDF file is missing:
- System logs a warning
- Email is still sent (without that attachment)
- Approval process continues normally

## Production Deployment

**For Vercel:**
- Consider using Vercel Blob Storage or S3 for PDF storage
- Update `loadInvestorPdfs.ts` to fetch from object storage
- Or bundle small PDFs at build time

**For filesystem:**
- Ensure this directory exists on the server
- Set appropriate file permissions (read-only for server)
- Do NOT commit sensitive PDFs to git


