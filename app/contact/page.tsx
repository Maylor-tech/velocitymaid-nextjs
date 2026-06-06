import ContactHero from "@/components/ContactHero";
import Section from "@/components/Section";
import ContactForm from "@/components/ContactForm";
import ContactConfirmation from "@/components/ContactConfirmation";
import MarketingShell from "@/components/layout/MarketingShell";

export default function ContactPage() {
  return (
    <MarketingShell>
      <ContactHero />
      <Section>
        <ContactForm />
        <ContactConfirmation />
      </Section>
    </MarketingShell>
  );
}


