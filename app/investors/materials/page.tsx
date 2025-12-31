/**
 * Investor Materials Page
 * 
 * Gated PDF access page for qualified investors
 * Signals seriousness, captures intent, protects sensitive materials
 * Phase-appropriate gating - calm, not salesy
 */

"use client";

import { useState } from "react";
import InvestorMaterialsHero from "@/components/InvestorMaterialsHero";
import Section from "@/components/Section";
import InvestorMaterialsList from "@/components/InvestorMaterialsList";
import InvestorAccessForm from "@/components/InvestorAccessForm";
import AccessPendingNotice from "@/components/AccessPendingNotice";

export default function InvestorMaterialsPage() {
  const [accessRequested, setAccessRequested] = useState(false);

  return (
    <>
      <InvestorMaterialsHero />

      <Section>
        <InvestorMaterialsList />
        {!accessRequested ? (
          <InvestorAccessForm onSubmitted={() => setAccessRequested(true)} />
        ) : (
          <AccessPendingNotice />
        )}
      </Section>
    </>
  );
}

