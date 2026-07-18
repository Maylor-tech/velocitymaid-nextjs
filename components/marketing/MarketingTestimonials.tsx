import { Star } from "lucide-react";
import type { MarketingTestimonial } from "@/lib/marketing/testimonials";

export function MarketingTestimonials({
  testimonials,
  title = "What Our Customers Say",
  subtitle,
}: {
  testimonials: MarketingTestimonial[];
  title?: string;
  subtitle?: string;
}) {
  if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="scroll-mt-20 bg-white px-5 py-16">
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
          Reviews
        </p>
        <h2 className="font-heading text-3xl font-bold text-vm-navy">{title}</h2>
        {subtitle && (
          <p className="mx-auto mt-3 max-w-2xl font-body text-sm leading-relaxed text-vm-muted">
            {subtitle}
          </p>
        )}
        <div
          className={`mt-9 grid gap-5 text-left ${
            testimonials.length === 1 ? "mx-auto max-w-xl" : "md:grid-cols-3"
          }`}
        >
          {testimonials.map((testimonial) => (
            <article
              key={`${testimonial.name}-${testimonial.location}`}
              className="rounded-xl border border-vm-border bg-vm-surface p-6"
            >
              {testimonial.rating !== undefined && (
                <div
                  className="mb-4 flex gap-1"
                  aria-label={`${testimonial.rating} out of 5 stars`}
                >
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-vm-cyan text-vm-cyan" />
                  ))}
                </div>
              )}
              <p className="font-body text-sm leading-relaxed text-vm-text">
                &ldquo;{testimonial.text}&rdquo;
              </p>
              <div className="mt-5 border-t border-vm-border pt-4">
                <p className="font-heading text-sm font-bold text-vm-navy">
                  {testimonial.name}
                </p>
                <p className="mt-1 font-body text-xs text-vm-muted">
                  {testimonial.location}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
