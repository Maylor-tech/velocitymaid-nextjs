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

export const metadata = {
  title: "Partner with VelocityMaid | Infrastructure for Trust at Scale",
  description: "VelocityMaid helps contractor-based organizations strengthen compliance and readiness without disrupting existing operations. Start with a low-risk pilot.",
};

export default function PartnersPage() {
  return (
    <>
      <PartnerHero />

      <Section>
        <h2 className="text-2xl font-semibold text-gray-900">
          Built for Responsible Partnerships
        </h2>
        <p className="mt-4 max-w-3xl text-gray-600">
          VelocityMaid is designed to support partners who value clarity,
          accountability, and deliberate growth.
        </p>
      </Section>

      <Section>
        <PartnerValue />
      </Section>

      <Section>
        <PartnerPilotCTA />
      </Section>
    </>
  );
}


