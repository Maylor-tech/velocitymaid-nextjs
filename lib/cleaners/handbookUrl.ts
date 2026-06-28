export const CLEANER_HANDBOOK_FILENAME = "VelocityMaid_Cleaner_Handbook_v1.0.pdf";

export function getCleanerHandbookUrl(): string {
  return (
    process.env.CLEANER_HANDBOOK_URL ||
    `${process.env.NEXT_PUBLIC_BASE_URL || "https://velocitymaid.com"}/downloads/${CLEANER_HANDBOOK_FILENAME}`
  );
}
