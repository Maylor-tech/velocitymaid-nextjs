import PricingHero from "@/components/PricingHero";
import Section from "@/components/Section";
import PricingTiers from "@/components/PricingTiers";
import PricingFAQ from "@/components/PricingFAQ";
import PricingCTA from "@/components/PricingCTA";
import Footer from "@/components/Footer";

export default function PricingPage() {
  return (
    <>
      <PricingHero />

      <Section>
        <PricingTiers />
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold text-gray-900">
          Pricing FAQ
        </h2>
        <div className="mt-8">
          <PricingFAQ />
        </div>
      </Section>

      <Section>
        <PricingCTA />
      </Section>

      <Footer />
    </>
  );
}


