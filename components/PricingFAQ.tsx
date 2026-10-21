const items = [
  {
    q: "Are these prices fixed?",
    a: "No. Website prices are starting points. Final pricing is confirmed after reviewing the property, service scope, schedule, condition, and requested services.",
  },
  {
    q: "How do Vermont and New Jersey pricing differ?",
    a: "Vermont service focuses on vacation-rental turnovers and property readiness, typically starting from $225. New Jersey service focuses on recurring residential cleaning (primary), deep cleaning, and move-in/move-out across our Essex County service area — pricing is confirmed after a quote review, not published as a starting rate.",
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
    a: "Property size, condition, occupancy, laundry/linen needs, add-on services, access timing, and whether the visit is a standard turnover or a deeper reset.",
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
