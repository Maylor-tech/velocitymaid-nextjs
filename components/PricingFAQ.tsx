export default function PricingFAQ() {
  const items = [
    {
      q: "What is an active contractor?",
      a: "An active contractor is any contractor onboarded in VelocityMaid whose compliance is tracked during the billing period. Archived or inactive contractors are not billed.",
    },
    {
      q: "Are there setup fees or seat licenses?",
      a: "No. VelocityMaid does not charge setup fees, per-seat fees, or per-report fees. Pricing is aligned with operational usage, not headcount overhead.",
    },
    {
      q: "Is there a pilot option?",
      a: "Yes. Most partners begin with a 30–60 day pilot, often free or offered at a small flat fee. Pilots run in parallel with existing operations.",
    },
    {
      q: "Are payments required?",
      a: "No. VelocityMaid begins with compliance infrastructure. Payment rails are optional and added later, only when appropriate.",
    },
    {
      q: "Are long-term contracts required?",
      a: "No long-term commitment is required to get started. Enterprise organizations may opt into custom agreements.",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {items.map((item) => (
        <div
          key={item.q}
          className="rounded-xl border border-brand-forest/10 bg-white p-6 shadow-sm"
        >
          <h4 className="font-serif font-semibold text-brand-forest">{item.q}</h4>
          <p className="mt-2 text-brand-slate/70 font-sans text-sm leading-relaxed">
            {item.a}
          </p>
        </div>
      ))}
    </div>
  );
}
