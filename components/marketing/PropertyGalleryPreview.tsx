import Image from "next/image";
import { ImageIcon, LockKeyhole } from "lucide-react";

export type PropertyGalleryImage = {
  src: string;
  alt: string;
};

export type PropertyGalleryItem = {
  name: string;
  location: string;
  /** First image is the card hero; the rest render as a thumbnail strip. */
  images?: readonly PropertyGalleryImage[];
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
            const images = item.permissionGranted ? (item.images ?? []) : [];
            const canShowImage = images.length > 0;
            const [hero, ...thumbnails] = images;

            return (
              <article
                key={`${item.name}-${item.location}`}
                className="overflow-hidden rounded-xl border border-vm-border bg-white text-left"
              >
                <div className="relative flex aspect-[4/3] items-center justify-center bg-vm-navy">
                  {canShowImage ? (
                    <Image
                      src={hero.src}
                      alt={hero.alt}
                      fill
                      sizes="(max-width: 767px) calc(100vw - 2.5rem), (max-width: 1100px) calc((100vw - 5rem) / 3), 328px"
                      className="object-cover"
                      loading="lazy"
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
                {thumbnails.length > 0 && (
                  <div className="grid grid-cols-4 gap-1 p-1">
                    {thumbnails.map((thumb) => (
                      <div
                        key={thumb.src}
                        className="relative aspect-square overflow-hidden rounded"
                      >
                        <Image
                          src={thumb.src}
                          alt={thumb.alt}
                          fill
                          sizes="(max-width: 767px) calc((100vw - 4rem) / 4), (max-width: 1100px) calc((100vw - 8rem) / 12), 78px"
                          className="object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
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
