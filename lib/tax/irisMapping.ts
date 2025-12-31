/**
 * Phase 3H.2: IRIS 1099 Mapping Configuration
 * 
 * Editable mapping per year/template from IRIS portal / Pub 5717
 * 
 * To update: Edit this file with the latest IRIS column requirements
 */

export const irisMapping = {
  "2025": {
    description: "IRIS 1099-NEC mapping for 2025 (Pub 5717)",
    columns: [
      "Record Type",
      "Payment Year",
      "Corrected Return Indicator",
      "Name Line 1",
      "Name Line 2",
      "TIN Type",
      "TIN",
      "Address Line 1",
      "Address Line 2",
      "City",
      "State",
      "ZIP Code",
      "Country",
      "Account Number",
      "Amount",
      "Federal Income Tax Withheld",
      "Nonemployee Compensation",
    ],
    mapping: {
      "Record Type": "1",
      "Payment Year": "{{year}}",
      "Corrected Return Indicator": "",
      "Name Line 1": "{{legalName}}",
      "Name Line 2": "{{addressLine2 || ''}}",
      "TIN Type": "{{tinType === 'SSN' ? '1' : '2'}}",
      "TIN": "", // Option A: recipient_tin must be blank
      "Address Line 1": "{{addressLine1}}",
      "Address Line 2": "{{addressLine2 || ''}}",
      "City": "{{city}}",
      "State": "{{state}}",
      "ZIP Code": "{{zipCode}}",
      "Country": "{{country || 'US'}}",
      "Account Number": "{{cleanerId}}",
      "Amount": "{{totalAmount}}",
      "Federal Income Tax Withheld": "0.00",
      "Nonemployee Compensation": "{{totalAmount}}",
    },
  },
  "2026": {
    description: "IRIS 1099-NEC mapping for 2026+ (Pub 5717)",
    columns: [
      "Record Type",
      "Payment Year",
      "Corrected Return Indicator",
      "Name Line 1",
      "Name Line 2",
      "TIN Type",
      "TIN",
      "Address Line 1",
      "Address Line 2",
      "City",
      "State",
      "ZIP Code",
      "Country",
      "Account Number",
      "Amount",
      "Federal Income Tax Withheld",
      "Nonemployee Compensation",
    ],
    mapping: {
      "Record Type": "1",
      "Payment Year": "{{year}}",
      "Corrected Return Indicator": "",
      "Name Line 1": "{{legalName}}",
      "Name Line 2": "{{addressLine2 || ''}}",
      "TIN Type": "{{tinType === 'SSN' ? '1' : '2'}}",
      "TIN": "", // Option A: recipient_tin must be blank
      "Address Line 1": "{{addressLine1}}",
      "Address Line 2": "{{addressLine2 || ''}}",
      "City": "{{city}}",
      "State": "{{state}}",
      "ZIP Code": "{{zipCode}}",
      "Country": "{{country || 'US'}}",
      "Account Number": "{{cleanerId}}",
      "Amount": "{{totalAmount}}",
      "Federal Income Tax Withheld": "0.00",
      "Nonemployee Compensation": "{{totalAmount}}",
    },
  },
} as const;

