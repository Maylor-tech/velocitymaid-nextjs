export const DEFAULT_QUOTE_SENDER = {
  name: "Brian Bruce Maylor",
  title: "Founder & Managing Director · VelocityMaid",
  phone: "(802) 733-5348",
  email: "hello@velocitymaid.com",
  website: "https://velocitymaid.com",
} as const;

export const DEFAULT_INCLUSIONS = [
  "Full top-to-bottom deep clean throughout",
  "Post-renovation dust removal — surfaces, baseboards, vents, high areas",
  "Detailed kitchen and bathroom scrub",
  "Floor treatment throughout",
  "Working around any remaining boxes or materials",
  "Final walkthrough inspection before we leave",
  "Photo report sent same day",
];

export function formatQuoteValidUntil(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function buildDefaultValidUntil(): string {
  return formatQuoteValidUntil(addDays(new Date(), 14));
}

export function buildQuoteNumberFromSequence(sequence: number): string {
  return `VM-Q-${sequence}`;
}

export function buildConfirmSubject(quoteNumber: string, propertyAddress: string): string {
  return `Confirm booking — ${quoteNumber} — ${propertyAddress}`;
}

export function buildDefaultEmailSubject(
  quoteNumber: string,
  serviceTitle: string
): string {
  return `Your VelocityMaid quote ${quoteNumber} — ${serviceTitle}`;
}
