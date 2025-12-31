import ContactHero from "@/components/ContactHero";
import Section from "@/components/Section";
import ContactForm from "@/components/ContactForm";
import ContactConfirmation from "@/components/ContactConfirmation";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <>
      <ContactHero />

      <Section>
        <ContactForm />
        <ContactConfirmation />
      </Section>

      <Footer />
    </>
  );
}


