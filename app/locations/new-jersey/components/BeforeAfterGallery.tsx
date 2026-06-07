"use client";

import {
  Home,
  ClipboardCheck,
  KeyRound,
  Sparkles,
} from "lucide-react";
import BrandPhotoPlaceholder from "@/components/brand/BrandPhotoPlaceholder";

const HOSPITALITY_HIGHLIGHTS = [
  {
    icon: Home,
    title: "Guest-ready home care",
    subtitle: "Every room prepared to hospitality standards before you arrive.",
  },
  {
    icon: ClipboardCheck,
    title: "50-point hospitality checklist",
    subtitle: "Structured care protocol for consistent, premium results.",
  },
  {
    icon: KeyRound,
    title: "Move-in / Move-out cleaning",
    subtitle: "Complete transitions with cabinets, appliances, and final inspection.",
  },
  {
    icon: Sparkles,
    title: "Airbnb turnover support",
    subtitle: "Fast, reliable turnovers between guest stays.",
  },
] as const;

export default function BeforeAfterGallery() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {HOSPITALITY_HIGHLIGHTS.map((item) => (
        <BrandPhotoPlaceholder
          key={item.title}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
        />
      ))}
    </div>
  );
}
