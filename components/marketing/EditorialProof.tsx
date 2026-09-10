import Image from "next/image";
import type { PortfolioImage } from "@/lib/marketing/portfolio";

type EditorialProofProps = {
  id?: string;
  eyebrow: string;
  heading: string;
  copy: string;
  featured: PortfolioImage;
  supporting: readonly PortfolioImage[];
  tone?: "navy" | "light";
  actions?: React.ReactNode;
  featuredPriority?: boolean;
  contained?: boolean;
};

export function EditorialProof({
  id,
  eyebrow,
  heading,
  copy,
  featured,
  supporting,
  tone = "navy",
  actions,
  featuredPriority = false,
  contained = false,
}: EditorialProofProps) {
  const isNavy = tone === "navy";
  const captionClass = isNavy
    ? "mt-3 font-body text-sm text-white/70"
    : "mt-3 font-body text-sm text-vm-muted";

  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className={
        contained
          ? isNavy
            ? "rounded-xl bg-vm-navy px-6 py-12 sm:px-10 sm:py-14"
            : "rounded-xl border border-vm-border bg-white px-6 py-12 sm:px-10 sm:py-14"
          : isNavy
            ? "bg-vm-navy px-5 py-20 sm:py-24"
            : "bg-white px-5 py-20 sm:py-24"
      }
    >
      <div className="mx-auto max-w-marketing">
        <div className="max-w-2xl">
          <p
            className={
              isNavy
                ? "mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan"
                : "mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark"
            }
          >
            {eyebrow}
          </p>
          <h2
            id={id ? `${id}-heading` : undefined}
            className={
              isNavy
                ? "font-heading text-3xl font-bold text-white sm:text-4xl"
                : "font-heading text-3xl font-bold text-vm-navy sm:text-4xl"
            }
          >
            {heading}
          </h2>
          <p
            className={
              isNavy
                ? "mt-5 max-w-xl font-body text-sm leading-relaxed text-white/65 sm:text-base"
                : "mt-5 max-w-xl font-body text-sm leading-relaxed text-vm-muted sm:text-base"
            }
          >
            {copy}
          </p>
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <figure className="lg:col-span-8">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src={featured.src}
                alt={featured.alt}
                fill
                priority={featuredPriority}
                sizes="(max-width: 1023px) calc(100vw - 2.5rem), 760px"
                className="object-cover"
              />
            </div>
            <figcaption className={captionClass}>{featured.caption}</figcaption>
          </figure>
          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
            {supporting.map((image) => (
              <figure key={image.src}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1023px) calc((100vw - 3.25rem) / 2), 280px"
                    className="object-cover"
                  />
                </div>
                <figcaption className={captionClass}>{image.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        {actions ? <div className="mt-12 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
