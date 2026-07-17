import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { NewJerseyBookingMockup } from "@/components/marketing/MarketingPageSections";

export const metadata: Metadata = {
  title: "New Jersey Cleaning Services | VelocityMaid",
  description:
    "Reliable, background-checked cleaners in New Jersey. Starting-at pricing, professional teams, and convenient online booking for recurring, deep, and move-in or move-out cleaning.",
  keywords:
    "house cleaning New Jersey, professional cleaners NJ, cleaning service Newark, Jersey City cleaning, recurring cleaning NJ",
  alternates: { canonical: "https://velocitymaid.com/new-jersey" },
  openGraph: {
    title: "New Jersey Cleaning Services | VelocityMaid",
    description:
      "Reliable residential cleaning for homeowners, apartment residents, and busy professionals across New Jersey.",
    url: "https://velocitymaid.com/new-jersey",
    siteName: "VelocityMaid",
    type: "website",
  },
};

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const FALLBACK_PRICING = {
  standard: 120,
  deep: 220,
  moveInOut: 220,
};

async function getNewJerseyMarketingData() {
  try {
    const branch = await prisma.branch.findUnique({
      where: { slug: "new-jersey" },
      select: {
        id: true,
        BranchServicePackage: {
          where: { isActive: true },
          select: { code: true, basePrice: true },
        },
      },
    });

    if (!branch) return { pricing: FALLBACK_PRICING, promo: null };

    const findPrice = (tokens: string[], fallback: number) => {
      const service = branch.BranchServicePackage.find((item) => {
        const code = item.code.toLowerCase();
        return tokens.some((token) => code.includes(token));
      });
      return service ? Number(service.basePrice) : fallback;
    };

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

    return {
      pricing: {
        standard: findPrice(["basic", "standard"], FALLBACK_PRICING.standard),
        deep: findPrice(["deep"], FALLBACK_PRICING.deep),
        moveInOut: findPrice(
          ["moveinout", "move-in", "move_out"],
          FALLBACK_PRICING.moveInOut
        ),
      },
      promo: activePromo
        ? {
            title: activePromo.title,
            description: activePromo.description,
            bookingHref: `/book?branch=new-jersey&promo=${activePromo.month}-${activePromo.year}`,
          }
        : null,
    };
  } catch (error) {
    console.error("[new-jersey] Could not load marketing data", error);
    return { pricing: FALLBACK_PRICING, promo: null };
  }
}

export default async function NewJerseyPage() {
  const { pricing, promo } = await getNewJerseyMarketingData();

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "VelocityMaid New Jersey",
    url: "https://velocitymaid.com/new-jersey",
    telephone: "+18027335348",
    email: "hello@velocitymaid.com",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressRegion: "NJ",
      addressCountry: "US",
    },
    areaServed: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Union"].map(
      (name) => ({ "@type": "City", name })
    ),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "New Jersey Cleaning Services",
      itemListElement: [
        ["Standard Residential Cleaning", pricing.standard],
        ["Deep Cleaning", pricing.deep],
        ["Move-In / Move-Out Cleaning", pricing.moveInOut],
      ].map(([name, price]) => ({
        "@type": "Offer",
        price,
        priceCurrency: "USD",
        itemOffered: { "@type": "Service", name },
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
          text: "VelocityMaid serves Newark, Jersey City, Paterson, Elizabeth, Union, and surrounding New Jersey communities.",
        },
      },
      {
        "@type": "Question",
        name: "Can I schedule recurring cleaning?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Weekly, biweekly, and monthly residential cleaning plans are available.",
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
      <NewJerseyBookingMockup pricing={pricing} promo={promo} />
    </>
  );
}
