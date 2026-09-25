import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { NewJerseyBookingMockup } from "@/components/marketing/MarketingPageSections";
import { pageSocialMetadata } from "@/lib/seo/socialImages";
import {
  NJ_LEAD_PATH,
  NJ_SERVICE_CITIES,
  njCitiesShortList,
} from "@/lib/markets/newJersey";

const title = "New Jersey Cleaning Services | VelocityMaid";
const description =
  "Recurring residential cleaning in Bloomfield, Montclair, Newark, East Orange, Irvington, South Orange, West Orange, and Nutley. Request a custom quote — pricing confirmed after review.";

export const metadata: Metadata = {
  title,
  description,
  keywords:
    "house cleaning New Jersey, recurring cleaning NJ, Montclair cleaning, Bloomfield cleaning, Newark house cleaning, East Orange cleaning, Nutley cleaning",
  alternates: { canonical: "https://velocitymaid.com/new-jersey" },
  ...pageSocialMetadata({
    title,
    description:
      "Recurring residential cleaning across Elaine's New Jersey territory. Deep cleans and move-in/move-out available. Request a quote.",
    path: "/new-jersey",
    image: "default",
  }),
};

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function getNewJerseyPromo() {
  try {
    const branch = await prisma.branch.findUnique({
      where: { slug: "new-jersey" },
      select: { id: true },
    });
    if (!branch) return null;

    const now = new Date();
    const activePromo = await prisma.promo.findFirst({
      where: {
        branchId: branch.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: { title: true, description: true, month: true, year: true },
    });

    if (!activePromo) return null;
    return {
      title: activePromo.title,
      description: activePromo.description,
      bookingHref: `${NJ_LEAD_PATH}?promo=${activePromo.month}-${activePromo.year}`,
    };
  } catch (error) {
    console.error("[new-jersey] Could not load promo", error);
    return null;
  }
}

export default async function NewJerseyPage() {
  const promo = await getNewJerseyPromo();

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "VelocityMaid New Jersey",
    url: "https://velocitymaid.com/new-jersey",
    telephone: "+18027335348",
    email: "hello@velocitymaid.com",
    address: {
      "@type": "PostalAddress",
      addressRegion: "NJ",
      addressCountry: "US",
    },
    areaServed: NJ_SERVICE_CITIES.map((name) => ({
      "@type": "City",
      name,
    })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "New Jersey Cleaning Services",
      itemListElement: [
        "Recurring Residential Cleaning",
        "Deep Cleaning",
        "Move-In / Move-Out Cleaning",
      ].map((name) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name },
        description: "Custom quote — pricing confirmed after review",
      })),
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What areas in New Jersey do you serve?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `VelocityMaid serves ${njCitiesShortList()}.`,
        },
      },
      {
        "@type": "Question",
        name: "What is your primary New Jersey service?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Recurring residential cleaning is our primary New Jersey offer, followed by deep cleaning and move-in/move-out. Short-term rental cleaning is available on request.",
        },
      },
      {
        "@type": "Question",
        name: "How do I get pricing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Request a quote with your property details. We confirm New Jersey pricing after review — we do not publish starting rates until the pricing model is finalized.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <NewJerseyBookingMockup promo={promo} />
    </>
  );
}
