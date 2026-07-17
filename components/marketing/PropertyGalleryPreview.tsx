import { ImageIcon, LockKeyhole } from "lucide-react";

export type PropertyGalleryItem = {
  name: string;
  location: string;
  imageSrc?: string;
  imageAlt?: string;
  permissionGranted?: boolean;
};

export function PropertyGalleryPreview({
  items,
  title = "Properties We Care For",
  description,
}: {
  items: PropertyGalleryItem[];
  title?: string;
  description?: string;
}) {
  return (
    <section aria-labelledby="property-gallery-title" className="bg-vm-surface px-5 py-16">
      <div className="mx-auto max-w-5xl text-center">
        <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
          Property gallery
        </p>
        <h2 id="property-gallery-title" className="font-heading text-3xl font-bold text-vm-navy">
          {title}
        </h2>
        {description && (
          <p className="mx-auto mt-3 max-w-2xl font-body text-sm leading-relaxed text-vm-muted">
            {description}
          </p>
        )}

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {items.map((item) => {
            const canShowImage = Boolean(
              item.permissionGranted && item.imageSrc && item.imageAlt
            );

            return (
              <article
                key={`${item.name}-${item.location}`}
                className="overflow-hidden rounded-xl border border-vm-border bg-white text-left"
              >
                <div className="relative flex aspect-[4/3] items-center justify-center bg-vm-navy">
                  {canShowImage ? (
                    // Kept as a standard img so this reusable staged component does
                    // not require a real image until permission is explicitly granted.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageSrc}
                      alt={item.imageAlt}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 px-6 text-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                        <ImageIcon className="h-5 w-5 text-vm-cyan" />
                      </span>
                      <p className="font-body text-xs leading-relaxed text-white/55">
                        Photography reserved pending client approval
                      </p>
                    </div>
                  )}
                  {!canShowImage && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wide text-vm-navy">
                      <LockKeyhole className="h-3 w-3" />
                      Pending permission
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-heading text-sm font-bold text-vm-navy">
                    {item.name}
                  </h3>
                  <p className="mt-1 font-body text-xs text-vm-muted">{item.location}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
