/**
 * Partner Hero Section
 * 
 * Calm, operational hero section for the partners landing page
 * Aligned with locked brand voice: "Infrastructure for trust at scale."
 */

export default function PartnerHero() {
  return (
    <div className="border-b border-brand-forest/10">
      <div className="mx-auto max-w-marketing px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-brand-forest">
          Partner with VelocityMaid
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-sans font-medium text-brand-slate/80 leading-relaxed">
          Operational infrastructure for hospitality-grade property care.
        </p>
        <p className="mt-6 max-w-3xl text-sm sm:text-base font-sans font-medium text-brand-slate/70 leading-relaxed">
          Strengthen compliance and readiness across your specialist network
          without disrupting existing operations.
        </p>
      </div>
    </div>
  );
}


