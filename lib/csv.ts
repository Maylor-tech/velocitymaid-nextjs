/**
 * CSV Generation Helper
 * 
 * Safely generates CSV files with proper escaping and formatting
 * Ensures Excel compatibility
 */

/**
 * Escape a CSV field value
 * Handles quotes, commas, and newlines
 */
export function escapeCsvField(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);

  // If the field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generate CSV row from array of values
 */
export function csvRow(values: any[]): string {
  return values.map(escapeCsvField).join(",");
}

/**
 * Generate CSV header row
 */
export function csvHeader(headers: string[]): string {
  return csvRow(headers);
}

/**
 * Generate CSV file content
 * @param headers - Array of column headers
 * @param rows - Array of arrays representing data rows
 * @returns CSV string with BOM for Excel UTF-8 compatibility
 */
export function generateCsv(headers: string[], rows: any[][]): string {
  const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const headerRow = csvHeader(headers);
  const dataRows = rows.map((row) => csvRow(row));
  return bom + [headerRow, ...dataRows].join("\n");
}

/**
 * Format date for CSV (ISO format for Excel compatibility)
 */
export function formatCsvDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0]; // YYYY-MM-DD format
}

/**
 * Format datetime for CSV (ISO format for Excel compatibility)
 */
export function formatCsvDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString(); // Full ISO datetime
}

/**
 * Format currency for CSV (plain number, no symbol)
 */
export function formatCsvCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "";
  return amount.toFixed(2);
}
















