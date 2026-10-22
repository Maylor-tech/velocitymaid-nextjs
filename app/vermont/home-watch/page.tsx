import type { Metadata } from "next";
import { VermontHomeWatch } from "@/components/marketing/VermontHomeWatch";
import { pageSocialMetadata } from "@/lib/seo/socialImages";

const title = "Vermont Home Watch | VelocityMaid";
const description =
  "Scheduled visits for empty Vermont homes. We walk a property checklist and send a photo report after every visit.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/vermont/home-watch" },
  ...pageSocialMetadata({
    title,
    description,
    path: "/vermont/home-watch",
    image: "vermont",
  }),
};

export default function VermontHomeWatchPage() {
  return <VermontHomeWatch />;
}
