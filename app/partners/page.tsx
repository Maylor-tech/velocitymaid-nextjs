/**
 * Partners Landing Page
 * 
 * Fully aligned with locked brand voice
 * Calm, operational, low-risk
 * Designed to convert serious partners, not browsers
 */

import PartnerHero from "@/components/PartnerHero";
import Section from "@/components/Section";
import PartnerValue from "@/components/PartnerValue";
import PartnerPilotCTA from "@/components/PartnerPilotCTA";
import MarketingShell from "@/components/layout/MarketingShell";

export const metadata = {
  title: "Partner with VelocityMaid | Infrastructure for Trust at Scale",
  description: "VelocityMaid helps contractor-based organizations strengthen compliance and readiness without disrupting existing operations. Start with a low-risk pilot.",
};

export default function PartnersPage() {
  return (
    <MarketingShell>
      <PartnerHero />
      <Section>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-vm-navy">
          Built for Responsible Partnerships
        </h2>
        <p className="mt-4 max-w-3xl text-sm sm:text-base font-sans font-medium text-vm-text/80 leading-relaxed">
          VelocityMaid supports partners who value clarity, accountability, and
          deliberate growth.
        </p>
      </Section>
      <Section>
        <PartnerValue />
      </Section>
      <Section>
        <PartnerPilotCTA />
      </Section>
    </MarketingShell>
  );
}


