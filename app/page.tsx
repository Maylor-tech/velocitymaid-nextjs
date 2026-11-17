import type { Metadata } from "next";
import { Homepage } from "@/components/vm/Homepage";
import { pageSocialMetadata, SITE_ORIGIN } from "@/lib/seo/socialImages";

const title =
  "VelocityMaid — Vacation-rental turnovers & home cleaning in Vermont and New Jersey";
const description =
  "Hotel-standard turnovers and home cleaning with a photo report after every clean. Insured, background-checked team, re-clean guarantee.";

export const metadata: Metadata = {
  title,
  description,
  ...pageSocialMetadata({
    title,
    description,
    path: "/",
    image: "default",
  }),
};

/** LocalBusiness JSON-LD — no aggregate ratings / review stars (handoff §5). */
const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "VelocityMaid",
  url: SITE_ORIGIN,
  email: "hello@velocitymaid.com",
  telephone: ["+18027335348", "+19732809190"],
  areaServed: [
    { "@type": "State", name: "Vermont" },
    { "@type": "State", name: "New Jersey" },
  ],
  description,
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd),
        }}
      />
      <Homepage />
    </>
  );
}
