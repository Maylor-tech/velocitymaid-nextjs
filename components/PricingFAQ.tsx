const items = [
  {
    q: "Are these prices fixed?",
    a: "Yes, for Okemo Valley turnovers. The price is set by bedroom count. Homes with 5+ bedrooms, Middlebury and outlying towns get a custom quote. New Jersey cleaning is quoted after a quick review.",
  },
  {
    q: "How do Vermont and New Jersey pricing differ?",
    a: "Vermont service is vacation-rental turnovers and property readiness. New Jersey service is recurring residential cleaning, deep cleaning, and move-in/move-out across our Essex County service area. Get a quote — we reply within one business day.",
  },
  {
    q: "How do I get a Vermont quote?",
    a: "Get a turnover quote at the Vermont host form. Call or text (802) 733-5348, or email hello@velocitymaid.com.",
  },
  {
    q: "Can I request a New Jersey quote online?",
    a: "Yes. Request a quote online in minutes. Scope and final price are confirmed for your home before service.",
  },
  {
    q: "What affects the final price?",
    a: "Okemo Valley turnovers are set by bedroom count. Homes with 5+ bedrooms, Middlebury and outlying towns get a custom quote. New Jersey cleaning is quoted after a quick review.",
  },
];

export default function PricingFAQ() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {items.map((item) => (
        <details
          key={item.q}
          className="group rounded-xl border border-vm-border bg-white p-5 shadow-sm"
        >
          <summary className="cursor-pointer list-none font-heading text-sm font-bold text-vm-navy">
            {item.q}
          </summary>
          <p className="mt-3 font-body text-sm leading-relaxed text-vm-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
