import { Camera, CircleDollarSign, ClipboardCheck, Home, ListChecks } from "lucide-react";

const HOST_STEPS = [
  {
    title: "Intake",
    text: "Tell us the property. No card needed to request a quote.",
    icon: ClipboardCheck,
  },
  {
    title: "Property checklist",
    text: "We confirm one price before we start, and whether we can cover the property.",
    icon: ListChecks,
  },
  {
    title: "Turnover",
    text: "We serve the Okemo Valley and Middlebury areas. The clean follows that home's checklist.",
    icon: Home,
  },
  {
    title: "Photos",
    text: "The photos prove the home is guest-ready before arrival.",
    icon: Camera,
  },
  {
    title: "One pay link",
    text: "Card or Zelle, after you see the photos.",
    icon: CircleDollarSign,
  },
] as const;

const HOME_STEPS = [
  {
    title: "Tell us the home",
    text: "A short form about your house. No card needed to request a quote.",
    icon: ClipboardCheck,
  },
  {
    title: "One price",
    text: "We confirm one price before we start. No prepayment.",
    icon: ListChecks,
  },
  {
    title: "The visit",
    text: "We clean the home you described.",
    icon: Home,
  },
  {
    title: "Photos",
    text: "Photos show the work is finished.",
    icon: Camera,
  },
  {
    title: "One pay link",
    text: "When we finish, you get photos of the work and one simple payment link.",
    icon: CircleDollarSign,
  },
] as const;

type AfterTheCleanProps = {
  className?: string;
  variant?: "host" | "home";
};

export function AfterTheClean({ className = "", variant = "host" }: AfterTheCleanProps) {
  const steps = variant === "home" ? HOME_STEPS : HOST_STEPS;
  return (
    <section
      className={`bg-vm-surface px-5 py-16 ${className}`}
      aria-labelledby="after-the-clean-heading"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
          How it works
        </p>
        <h2
          id="after-the-clean-heading"
          className="font-heading text-3xl font-bold text-vm-navy"
        >
          Intake, checklist, turnover, photos, one pay link.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl font-body text-sm leading-relaxed text-vm-muted">
          When we finish, you get photos of the work and one simple payment link.
        </p>
        <ol className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-5">
          {steps.map(({ title, text, icon: Icon }, index) => (
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
