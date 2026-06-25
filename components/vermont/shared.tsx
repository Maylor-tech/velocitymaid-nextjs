import type { ReactNode } from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

export function TrustBadge({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-body text-white/70">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-vm-cyan/20">
        <CheckCircle2 className="h-2.5 w-2.5 text-vm-cyan" />
      </span>
      <span>{children}</span>
    </div>
  );
}

export function ServiceImageCard({
  imageSrc,
  imageAlt,
  children,
}: {
  imageSrc: string;
  imageAlt: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white border border-vm-border rounded-xl overflow-hidden flex flex-col">
      <div className="relative w-full aspect-[16/10] bg-vm-navy">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
        />
      </div>
      <div className="p-5 flex-1 flex flex-col">{children}</div>
    </div>
  );
}
