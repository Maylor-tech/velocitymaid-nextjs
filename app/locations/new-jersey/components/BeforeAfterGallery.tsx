import Image from "next/image";

/** High-quality stock image — single "after" showcase (no before photos in marketing). */
export const NJ_SHOWCASE_IMAGE =
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80";

export const NJ_SHOWCASE_ALT =
  "Clean, professionally maintained home — VelocityMaid New Jersey";

export default function BeforeAfterGallery() {
  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-vm-navy/10">
      <Image
        src={NJ_SHOWCASE_IMAGE}
        alt={NJ_SHOWCASE_ALT}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
      />
    </div>
  );
}
