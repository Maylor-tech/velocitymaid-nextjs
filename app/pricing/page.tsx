import PricingHero from "@/components/PricingHero";
import Section from "@/components/Section";
import PricingTiers from "@/components/PricingTiers";
import PricingFAQ from "@/components/PricingFAQ";
import PricingCTA from "@/components/PricingCTA";
import MarketingShell from "@/components/layout/MarketingShell";

export default function PricingPage() {
  return (
    <MarketingShell>
      <PricingHero />
      <Section>
        <PricingTiers />
      </Section>
      <Section>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-brand-forest">
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


