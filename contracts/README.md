# Contracts Directory

This directory contains contract templates and generated contracts for VelocityMaid Jamaica.

## Structure

```
/contracts/
├── cleaner-agreement.pdf (placeholder)
├── customer-terms.pdf (placeholder)
├── villa-partnership.pdf (placeholder)
├── templates/
│   ├── cleaner-agreement-template.docx (placeholder)
│   ├── customer-terms-template.docx (placeholder)
│   └── villa-partnership-template.docx (placeholder)
└── generated/
    └── (filled contracts saved here)
```

## Contract Types

1. **Cleaner Agreement** - For cleaner onboarding
2. **Customer Terms** - Terms of service for customers
3. **Villa Partnership** - Villa partnership agreements

## Brand Colors

- Primary: #0A3D2F (Deep Green)
- Accent: #F8C548 (Gold)
- Accent2: #2B70C9 (Blue)
- Neutral: #F3F1EB (Beige)
- White: #FFFFFF

## Usage

Contracts are generated via API routes:
- `/api/contracts/cleaner/generate`
- `/api/contracts/customer/generate`
- `/api/contracts/villa/generate`

Signed contracts are stored in the database and can be viewed via:
- `/api/contracts/view/[contractId]`

## Note

Actual PDF files and DOCX templates need to be created by legal/design team. The system currently generates HTML that can be printed to PDF.

