import type { Metadata } from "next";
import PricingHero from "@/components/PricingHero";
import Section from "@/components/Section";
import PricingTiers from "@/components/PricingTiers";
import PricingFAQ from "@/components/PricingFAQ";
import PricingCTA from "@/components/PricingCTA";
import MarketingShell from "@/components/layout/MarketingShell";
import { VermontTurnoverPrices } from "@/components/marketing/VermontTurnoverPrices";
import { VERMONT_HOST_INTAKE_PATH } from "@/lib/marketing/publicCtas";

export const metadata: Metadata = {
  title: "Get a quote | VelocityMaid — Vermont & New Jersey",
  description:
    "Get a quote — we reply within one business day. Vermont vacation-rental turnovers and New Jersey residential cleaning.",
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <PricingHero />
      <Section>
        <VermontTurnoverPrices bookHref={`${VERMONT_HOST_INTAKE_PATH}#get-quote`} />
      </Section>
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
