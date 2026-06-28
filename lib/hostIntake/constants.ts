export const SQUARE_FOOTAGE_OPTIONS = [
  "Under 1,000 sq ft",
  "1,000–1,500",
  "1,500–2,500",
  "2,500–3,500",
  "3,500+",
] as const;

export const PROPERTY_AMENITY_OPTIONS = [
  "Hot tub",
  "Outdoor grill / BBQ",
  "Pool",
  "In-unit laundry",
  "Garage",
  "Large deck or outdoor area",
  "Basement (guest access)",
  "Office (restricted)",
] as const;

export const ACCESS_TYPE_OPTIONS = [
  "Keypad / Smart lock",
  "Lockbox with key",
  "I will provide key on site",
  "Other (please describe)",
] as const;

export const GUEST_CHECKOUT_OPTIONS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "Other",
] as const;

export const GUEST_CHECKIN_OPTIONS = [
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "Other",
] as const;

export const LINEN_PROVIDER_OPTIONS = [
  "Host provides — stored on property",
  "VelocityMaid linen service (ask us)",
  "Guests bring their own",
] as const;

export const SAME_DAY_TURNOVER_OPTIONS = [
  "Yes — guests often check out and in the same day",
  "Occasionally — depends on the season",
  "No — always overnight gap",
] as const;

export const BOOKING_ADVANCE_OPTIONS = [
  "Same day",
  "1–3 days",
  "1 week",
  "2+ weeks",
  "Varies",
] as const;

export const PROPERTY_ACTIVE_SEASON_OPTIONS = [
  "Winter / Ski season (Dec–Mar)",
  "Summer (Jun–Aug)",
  "Fall foliage (Sep–Nov)",
  "Year-round",
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  "PayPal (preferred for Vermont)",
  "Credit / Debit card",
  "Electronic transfer",
] as const;

export const HOST_WELCOME_PACKET_URL =
  process.env.HOST_WELCOME_PACKET_URL ||
  `${process.env.NEXT_PUBLIC_BASE_URL || "https://velocitymaid.com"}/downloads/VelocityMaid_Host_Welcome_Packet_v1.0.pdf`;
