import type { Metadata } from "next";
import QuoteComposer from "@/components/admin/quotes/QuoteComposer";

export const metadata: Metadata = {
  title: "Send Quote | VelocityMaid Admin",
  description: "Compose and send branded VelocityMaid quote emails",
};

export default function AdminNewQuotePage() {
  return <QuoteComposer />;
}
