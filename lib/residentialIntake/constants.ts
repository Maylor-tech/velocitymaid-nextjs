export const RESIDENTIAL_SERVICE_TYPES = [
  "Standard",
  "Recurring",
  "Deep Clean",
  "Move-in-Out",
  "Other",
] as const;

export const RESIDENTIAL_FREQUENCIES = [
  "One-time",
  "Weekly",
  "Biweekly",
  "Monthly",
  "Other",
] as const;

export const RESIDENTIAL_CONTACT_METHODS = [
  "Email",
  "Phone",
  "Text",
] as const;

export const RESIDENTIAL_SUPPLIES = [
  "Customer supplies products",
  "VelocityMaid supplies products",
] as const;

export const RESIDENTIAL_CONDITION_FLAGS = [
  { id: "heavy_grease", label: "Heavy grease or buildup" },
  { id: "visible_mold_mildew", label: "Visible mold/mildew" },
  { id: "smoking_residue", label: "Smoking residue" },
  { id: "pet_waste_odors", label: "Pet waste or strong odors" },
  { id: "excessive_clutter", label: "Excessive clutter/restricted access" },
  { id: "pest_activity", label: "Pest activity" },
  { id: "damaged_surfaces", label: "Peeling/damaged surfaces" },
  { id: "other", label: "Other unusual conditions" },
] as const;

export const RESIDENTIAL_CONDITION_DISCLAIMER =
  "This condition may require additional labor or a revised quote after assessment. VelocityMaid will confirm scope and pricing before work beyond the approved service is performed.";

export const RESIDENTIAL_PRICING_BASES = [
  "RECURRING_FLAT",
  "DEEP_CLEAN_QUOTE",
  "HOURLY",
  "MIXED",
] as const;

export const RESIDENTIAL_CLEANING_SERVICE_TYPES = [
  "Standard",
  "Recurring",
  "Deep Clean",
  "Move-in-Out",
  "Other",
] as const;

export const RESIDENTIAL_LEAD_SOURCE = "Residential landing (/residential)";
export const RESIDENTIAL_PROPERTY_TYPE = "Residential home";
