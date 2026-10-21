import {
  SUPPORT_EMAIL,
  VERMONT_SUPPORT,
  VERMONT_WHATSAPP_URL,
} from "@/lib/customer/marketSupport";

export default function ContactHero() {
  return (
    <div className="border-b border-vm-border">
      <div className="mx-auto max-w-marketing px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-vm-navy">
          Contact
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-sans font-medium text-vm-muted leading-relaxed">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-vm-navy hover:text-vm-cyan-dark">
            Email — {SUPPORT_EMAIL}
          </a>
          {" · "}
          <a href={`tel:+1${VERMONT_SUPPORT.phoneTel}`} className="text-vm-navy hover:text-vm-cyan-dark">
            Call or text — {VERMONT_SUPPORT.phoneDisplay}
          </a>
          {" · "}
          <a href={VERMONT_WHATSAPP_URL} className="text-vm-navy hover:text-vm-cyan-dark">
            WhatsApp
          </a>
        </p>
        <p className="mt-6 max-w-3xl text-sm sm:text-base font-sans font-medium text-vm-muted leading-relaxed">
          We respond to estate managers, hospitality partners, and investors who
          value clarity, accountability, and responsible growth.
        </p>
      </div>
    </div>
  );
}


