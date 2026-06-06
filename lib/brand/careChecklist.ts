/**
 * VelocityMaid 50-Point Hospitality Standards Checklist
 * Shared across customer (readonly), cleaner (interactive), and admin (audit) portals.
 */

export interface CareChecklistItem {
  id: string;
  label: string;
  categoryId: string;
}

export interface CareChecklistCategory {
  id: string;
  title: string;
}

export const CARE_CHECKLIST_CATEGORIES: CareChecklistCategory[] = [
  { id: "entry", title: "Entry & First Impressions" },
  { id: "living", title: "Living & Gathering Spaces" },
  { id: "kitchen", title: "Kitchen & Dining" },
  { id: "bedrooms", title: "Bedrooms & Linens" },
  { id: "bathrooms", title: "Bathrooms & Fixtures" },
  { id: "finishing", title: "Finishing & Guest Presentation" },
];

export const CARE_CHECKLIST: CareChecklistItem[] = [
  // Entry & First Impressions (8)
  { id: "e1", categoryId: "entry", label: "Entry mat vacuumed and shaken" },
  { id: "e2", categoryId: "entry", label: "Front door and frame wiped" },
  { id: "e3", categoryId: "entry", label: "Entry console and surfaces dusted" },
  { id: "e4", categoryId: "entry", label: "Coat closet floor vacuumed" },
  { id: "e5", categoryId: "entry", label: "Light switches and handles sanitized" },
  { id: "e6", categoryId: "entry", label: "Mirrors and glass streak-free" },
  { id: "e7", categoryId: "entry", label: "Stair rails and banisters wiped" },
  { id: "e8", categoryId: "entry", label: "Hallway floors vacuumed or mopped" },
  // Living & Gathering (8)
  { id: "l1", categoryId: "living", label: "All surfaces dusted including shelving" },
  { id: "l2", categoryId: "living", label: "Upholstery vacuumed and fluffed" },
  { id: "l3", categoryId: "living", label: "Coffee tables and side tables polished" },
  { id: "l4", categoryId: "living", label: "Electronics screens dusted (dry cloth)" },
  { id: "l5", categoryId: "living", label: "Remote controls sanitized" },
  { id: "l6", categoryId: "living", label: "Carpets and rugs vacuumed thoroughly" },
  { id: "l7", categoryId: "living", label: "Hard floors mopped with appropriate finish" },
  { id: "l8", categoryId: "living", label: "Window sills and ledges wiped" },
  // Kitchen & Dining (10)
  { id: "k1", categoryId: "kitchen", label: "Countertops cleared, wiped, and sanitized" },
  { id: "k2", categoryId: "kitchen", label: "Appliance exteriors polished" },
  { id: "k3", categoryId: "kitchen", label: "Sink scrubbed and fixtures shined" },
  { id: "k4", categoryId: "kitchen", label: "Stovetop degreased and burners cleaned" },
  { id: "k5", categoryId: "kitchen", label: "Microwave interior wiped" },
  { id: "k6", categoryId: "kitchen", label: "Cabinet fronts wiped" },
  { id: "k7", categoryId: "kitchen", label: "Backsplash spot-cleaned" },
  { id: "k8", categoryId: "kitchen", label: "Dining table and chairs wiped" },
  { id: "k9", categoryId: "kitchen", label: "Trash emptied and liner replaced" },
  { id: "k10", categoryId: "kitchen", label: "Floor swept and mopped" },
  // Bedrooms & Linens (8)
  { id: "b1", categoryId: "bedrooms", label: "Beds made with hospital corners" },
  { id: "b2", categoryId: "bedrooms", label: "Fresh linens placed if scheduled" },
  { id: "b3", categoryId: "bedrooms", label: "Nightstands and dressers dusted" },
  { id: "b4", categoryId: "bedrooms", label: "Closet floors vacuumed" },
  { id: "b5", categoryId: "bedrooms", label: "Mirrors and glass cleaned" },
  { id: "b6", categoryId: "bedrooms", label: "Under-bed area vacuumed" },
  { id: "b7", categoryId: "bedrooms", label: "Light fixtures dusted" },
  { id: "b8", categoryId: "bedrooms", label: "Bedroom floors vacuumed or mopped" },
  // Bathrooms (8)
  { id: "ba1", categoryId: "bathrooms", label: "Toilet bowl, seat, and base sanitized" },
  { id: "ba2", categoryId: "bathrooms", label: "Shower and tub scrubbed, glass descaled" },
  { id: "ba3", categoryId: "bathrooms", label: "Vanity and sink fixtures polished" },
  { id: "ba4", categoryId: "bathrooms", label: "Mirrors streak-free" },
  { id: "ba5", categoryId: "bathrooms", label: "Floors mopped and corners detailed" },
  { id: "ba6", categoryId: "bathrooms", label: "Amenities restocked (soap, paper, towels)" },
  { id: "ba7", categoryId: "bathrooms", label: "Trash emptied" },
  { id: "ba8", categoryId: "bathrooms", label: "Grout and tile spot-treated" },
  // Finishing & Presentation (8)
  { id: "f1", categoryId: "finishing", label: "All interior doors wiped" },
  { id: "f2", categoryId: "finishing", label: "Baseboards dusted or wiped" },
  { id: "f3", categoryId: "finishing", label: "Ceiling fans and vents dusted" },
  { id: "f4", categoryId: "finishing", label: "Light bulbs checked and wiped" },
  { id: "f5", categoryId: "finishing", label: "Room scent neutralized (no harsh chemicals)" },
  { id: "f6", categoryId: "finishing", label: "Towels folded and staged" },
  { id: "f7", categoryId: "finishing", label: "Final walk-through quality inspection" },
  { id: "f8", categoryId: "finishing", label: "Property secured; lights and climate reset" },
];

export const CARE_CHECKLIST_TOTAL = CARE_CHECKLIST.length;

export function getChecklistByCategory(): Map<string, CareChecklistItem[]> {
  const map = new Map<string, CareChecklistItem[]>();
  for (const cat of CARE_CHECKLIST_CATEGORIES) {
    map.set(
      cat.id,
      CARE_CHECKLIST.filter((item) => item.categoryId === cat.id)
    );
  }
  return map;
}

export function getChecklistProgress(completedIds: string[]): {
  completed: number;
  total: number;
  percent: number;
} {
  const completed = completedIds.filter((id) =>
    CARE_CHECKLIST.some((item) => item.id === id)
  ).length;
  return {
    completed,
    total: CARE_CHECKLIST_TOTAL,
    percent: Math.round((completed / CARE_CHECKLIST_TOTAL) * 100),
  };
}
