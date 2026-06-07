import type { LucideIcon } from "lucide-react";

export interface BrandPhotoPlaceholderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  className?: string;
}

/** Branded placeholder when real photography is unavailable. */
export default function BrandPhotoPlaceholder({
  icon: Icon,
  title,
  subtitle,
  className = "",
}: BrandPhotoPlaceholderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center aspect-[4/3] rounded-xl border border-brand-forest/10 bg-gradient-to-br from-brand-ivory to-white p-6 text-center shadow-sm ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-forest/5 border border-brand-forest/10 mb-4">
        <Icon className="h-6 w-6 text-brand-gold" strokeWidth={1.5} />
      </div>
      <p className="font-serif font-semibold text-brand-forest text-sm sm:text-base leading-snug">
        {title}
      </p>
      {subtitle && (
        <p className="mt-2 text-xs font-sans text-brand-slate/60 leading-relaxed max-w-[14rem]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
