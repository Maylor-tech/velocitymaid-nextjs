import { ClipboardList, FileCheck, CalendarCheck, ShieldCheck, MessageSquare } from "lucide-react";

const STEPS = [
  {
    title: "Property Intake & Walkthrough",
    text: "We review your property, schedule, and guest standards before service begins.",
    icon: ClipboardList,
  },
  {
    title: "Property Profile & Service Standard",
    text: "Each home gets a clear checklist tailored to rooms, amenities, and host preferences.",
    icon: FileCheck,
  },
  {
    title: "Scheduled Turnover",
    text: "Turnovers are planned around checkout and check-in windows for guest-ready timing.",
    icon: CalendarCheck,
  },
  {
    title: "Quality Control & Completion",
    text: "Completion checks and documentation help keep results consistent from stay to stay.",
    icon: ShieldCheck,
  },
  {
    title: "Host Communication",
    text: "You receive clear updates—and property observations that help the next arrival go smoothly.",
    icon: MessageSquare,
  },
] as const;

type GuestReadyProcessProps = {
  tone?: "light" | "navy";
  className?: string;
};

export function GuestReadyProcess({ tone = "light", className = "" }: GuestReadyProcessProps) {
  const isNavy = tone === "navy";

  return (
    <section
      className={`${isNavy ? "bg-vm-navy" : "bg-white"} px-5 py-16 ${className}`}
      aria-labelledby="guest-ready-process-heading"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p
          className={`mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] ${
            isNavy ? "text-vm-cyan" : "text-vm-cyan-dark"
          }`}
        >
          How VelocityMaid works
        </p>
        <h2
          id="guest-ready-process-heading"
          className={`font-heading text-3xl font-bold ${isNavy ? "text-white" : "text-vm-navy"}`}
        >
          More than a clean. A guest-ready turnover system.
        </h2>
        <p
          className={`mx-auto mt-4 max-w-2xl font-body text-sm leading-relaxed ${
            isNavy ? "text-white/65" : "text-vm-muted"
          }`}
        >
          VelocityMaid combines cleaning with property-specific standards, host communication,
          completion checks, and operational observations so owners can prepare confidently for
          the next arrival.
        </p>
        <ol className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ title, text, icon: Icon }, index) => (
            <li
              key={title}
              className={`rounded-xl border p-5 ${
                isNavy ? "border-white/10 bg-white/5" : "border-vm-border bg-vm-surface"
              }`}
            >
              <span
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${
                  isNavy ? "bg-vm-cyan/15" : "bg-vm-cyan-tint"
                }`}
              >
                <Icon className={`h-4 w-4 ${isNavy ? "text-vm-cyan" : "text-vm-cyan-dark"}`} />
              </span>
              <p
                className={`font-body text-[10px] font-bold uppercase tracking-wider ${
                  isNavy ? "text-vm-cyan" : "text-vm-cyan-dark"
                }`}
              >
                Step {index + 1}
              </p>
              <h3
                className={`mt-1 font-heading text-sm font-bold ${
                  isNavy ? "text-white" : "text-vm-navy"
                }`}
              >
                {title}
              </h3>
              <p
                className={`mt-2 font-body text-xs leading-relaxed ${
                  isNavy ? "text-white/60" : "text-vm-muted"
                }`}
              >
                {text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
