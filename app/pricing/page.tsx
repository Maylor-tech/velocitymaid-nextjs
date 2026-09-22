import type { Metadata } from "next";
import PricingHero from "@/components/PricingHero";
import Section from "@/components/Section";
import PricingTiers from "@/components/PricingTiers";
import PricingFAQ from "@/components/PricingFAQ";
import PricingCTA from "@/components/PricingCTA";
import MarketingShell from "@/components/layout/MarketingShell";

export const metadata: Metadata = {
  title: "Cleaning Pricing | VelocityMaid — Vermont & New Jersey",
  description:
    "Starting-at pricing for Vermont vacation-rental turnovers and New Jersey residential cleaning. Final quotes confirmed after property review.",
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <PricingHero />
      <Section>
        <PricingTiers />
      </Section>
      <Section>
        <h2 className="font-heading text-3xl font-bold tracking-tight text-vm-navy sm:text-4xl">
          Pricing FAQ
        </h2>
        <div className="mt-8">
          <PricingFAQ />
        </div>
      </Section>
      <Section>
        <PricingCTA />
      </Section>
    </MarketingShell>
  );
}
