import { Camera, CircleDollarSign, ClipboardCheck, MapPin, Wallet } from "lucide-react";

const HOST_STEPS = [
  {
    title: "Tell us the property",
    text: "Address, beds, and the checkout / check-in window. Hosts are not charged a card to request a clean.",
    icon: ClipboardCheck,
  },
  {
    title: "We confirm we can cover it",
    text: "Okemo Valley and Middlebury are separate coverage. Same-day only if the route works. We will say no if we cannot reach you that day.",
    icon: MapPin,
  },
  {
    title: "We clean to the checklist",
    text: "Photos document guest-ready. You are not guessing whether the property is done.",
    icon: Camera,
  },
  {
    title: "Photos, then pay",
    text: "You get completion photos and a pay link. Card or Zelle. No need to call to ask if it is done.",
    icon: CircleDollarSign,
  },
  {
    title: "We pay the cleaner",
    text: "Their work is documented when yours is. You do not chase us to close the job.",
    icon: Wallet,
  },
] as const;

const HOME_STEPS = [
  {
    title: "Tell us the home",
    text: "Address, rooms, and when you want it done. No card until you approve the quote.",
    icon: ClipboardCheck,
  },
  {
    title: "We confirm coverage and price",
    text: "Invoice after approval — not prepaid booking. We will say if the schedule does not work.",
    icon: MapPin,
  },
  {
    title: "We clean and document",
    text: "Photos show the work is finished. You do not have to wonder.",
    icon: Camera,
  },
  {
    title: "Photos, then pay",
    text: "You get a pay link in the portal and by email. Card or Zelle.",
    icon: CircleDollarSign,
  },
  {
    title: "We pay the cleaner",
    text: "Their payout is queued when the job is marked complete.",
    icon: Wallet,
  },
] as const;

type AfterTheCleanProps = {
  className?: string;
  variant?: "host" | "home";
};

export function AfterTheClean({ className = "", variant = "host" }: AfterTheCleanProps) {
  const STEPS = variant === "home" ? HOME_STEPS : HOST_STEPS;
  return (
    <section
      className={`bg-vm-surface px-5 py-16 ${className}`}
      aria-labelledby="after-the-clean-heading"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
          After the clean
        </p>
        <h2
          id="after-the-clean-heading"
          className="font-heading text-3xl font-bold text-vm-navy"
        >
          Done. Documented. Paid.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl font-body text-sm leading-relaxed text-vm-muted">
          You should not need a phone call to understand what happens next. This is
          the close: photos, one pay link, and the cleaner is lined up to be paid.
        </p>
        <ol className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ title, text, icon: Icon }, index) => (
            <li
              key={title}
              className="rounded-xl border border-vm-border bg-white p-5"
            >
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-vm-cyan-tint">
                <Icon className="h-4 w-4 text-vm-cyan-dark" aria-hidden />
              </span>
              <p className="font-body text-[10px] font-bold uppercase tracking-wider text-vm-cyan-dark">
                Step {index + 1}
              </p>
              <h3 className="mt-1 font-heading text-sm font-bold text-vm-navy">
                {title}
              </h3>
              <p className="mt-2 font-body text-xs leading-relaxed text-vm-muted">
                {text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
