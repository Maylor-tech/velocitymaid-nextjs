/** Vermont property photos — public/images/vermont/ (Middlebury + Ludlow + Perkinsville) */
export const MIDDLEBURY_PHOTO_PATHS = {
  exteriorHero: "/images/vermont/01-middlebury-exterior-hero.jpg",
  frontEntry: "/images/vermont/02-middlebury-front-entry.jpg",
  sideEntry: "/images/vermont/03-middlebury-side-entry.jpg",
  bedroomMain: "/images/vermont/04-middlebury-bedroom-main.jpg",
  bedroomLoft: "/images/vermont/05-middlebury-bedroom-loft.jpg",
  livingRoom: "/images/vermont/06-middlebury-living-room.jpg",
  kitchen: "/images/vermont/07-middlebury-kitchen.jpg",
  bathroomMain: "/images/vermont/08-middlebury-bathroom-main.jpg",
  bathroomDetail: "/images/vermont/09-middlebury-bathroom-detail.jpg",
  homeRefresh: "/images/vermont/10-middlebury-home-refresh.jpg",
} as const;

export const LUDLOW_PHOTO_PATHS = {
  exteriorHero: "/images/vermont/11-ludlow-exterior-hero.jpg",
  livingRoom: "/images/vermont/12-ludlow-living-room.jpg",
  kitchen: "/images/vermont/13-ludlow-kitchen.jpg",
  bedroomMain: "/images/vermont/14-ludlow-bedroom-main.jpg",
  bathroomMain: "/images/vermont/15-ludlow-bathroom-main.jpg",
} as const;

export const PERKINSVILLE_PHOTO_PATHS = {
  exteriorHero: "/images/vermont/21-perkinsville-exterior-hero.jpg",
  livingRoom: "/images/vermont/24-perkinsville-living-room.jpg",
  kitchen: "/images/vermont/23-perkinsville-kitchen.jpg",
  bedroomMain: "/images/vermont/26-perkinsville-bedroom-1.jpg",
  bathroomMain: "/images/vermont/25-perkinsville-main-bathroom.jpg",
} as const;

/** Approved public photos for the Middlebury marketing card; permission confirmed. */
export const MIDDLEBURY_CARD_IMAGES = [
  {
    src: MIDDLEBURY_PHOTO_PATHS.exteriorHero,
    alt: "VelocityMaid Vermont vacation rental exterior in Middlebury",
  },
  {
    src: MIDDLEBURY_PHOTO_PATHS.livingRoom,
    alt: "VelocityMaid living room refresh for Vermont vacation rental",
  },
  {
    src: MIDDLEBURY_PHOTO_PATHS.kitchen,
    alt: "VelocityMaid kitchen cleaning in Middlebury Vermont",
  },
  {
    src: MIDDLEBURY_PHOTO_PATHS.bedroomLoft,
    alt: "VelocityMaid bedroom turnover service in Middlebury Vermont",
  },
  {
    src: MIDDLEBURY_PHOTO_PATHS.bathroomDetail,
    alt: "VelocityMaid bathroom deep cleaning in Middlebury Vermont",
  },
] as const;

/** Approved public photos for the Ludlow marketing card; town-level naming only. */
export const LUDLOW_CARD_IMAGES = [
  {
    src: LUDLOW_PHOTO_PATHS.exteriorHero,
    alt: "VelocityMaid vacation rental exterior in Ludlow, VT",
  },
  {
    src: LUDLOW_PHOTO_PATHS.livingRoom,
    alt: "VelocityMaid vacation rental living room in Ludlow, VT",
  },
  {
    src: LUDLOW_PHOTO_PATHS.kitchen,
    alt: "VelocityMaid vacation rental kitchen in Ludlow, VT",
  },
  {
    src: LUDLOW_PHOTO_PATHS.bedroomMain,
    alt: "VelocityMaid vacation rental main bedroom in Ludlow, VT",
  },
  {
    src: LUDLOW_PHOTO_PATHS.bathroomMain,
    alt: "VelocityMaid vacation rental main bathroom in Ludlow, VT",
  },
] as const;

/** Approved public photos for the Perkinsville marketing card; permission confirmed. */
export const PERKINSVILLE_CARD_IMAGES = [
  {
    src: PERKINSVILLE_PHOTO_PATHS.exteriorHero,
    alt: "VelocityMaid vacation rental exterior in Perkinsville, VT",
  },
  {
    src: PERKINSVILLE_PHOTO_PATHS.livingRoom,
    alt: "VelocityMaid vacation rental living room in Perkinsville, VT",
  },
  {
    src: PERKINSVILLE_PHOTO_PATHS.kitchen,
    alt: "VelocityMaid vacation rental kitchen in Perkinsville, VT",
  },
  {
    src: PERKINSVILLE_PHOTO_PATHS.bedroomMain,
    alt: "VelocityMaid vacation rental bedroom in Perkinsville, VT",
  },
  {
    src: PERKINSVILLE_PHOTO_PATHS.bathroomMain,
    alt: "VelocityMaid vacation rental main bathroom in Perkinsville, VT",
  },
] as const;

export interface VermontGalleryPhoto {
  src: string;
  alt: string;
  label: string;
  /** Town-level caption shown in the gallery overlay (never a street address). */
  location?: string;
}

/** Curated gallery carousel — marketing labels */
export const VERMONT_GALLERY_PHOTOS: VermontGalleryPhoto[] = [
  {
    src: MIDDLEBURY_PHOTO_PATHS.exteriorHero,
    alt: "VelocityMaid Vermont vacation rental exterior in Middlebury",
    label: "Property Exterior",
  },
  {
    src: MIDDLEBURY_PHOTO_PATHS.kitchen,
    alt: "VelocityMaid kitchen cleaning in Middlebury Vermont",
    label: "Kitchen Reset",
  },
  {
    src: MIDDLEBURY_PHOTO_PATHS.livingRoom,
    alt: "VelocityMaid living room refresh for Vermont vacation rental",
    label: "Living Room Refresh",
  },
  {
    src: MIDDLEBURY_PHOTO_PATHS.bedroomLoft,
    alt: "VelocityMaid bedroom turnover service in Middlebury Vermont",
    label: "Bedroom Turnover",
  },
  {
    src: MIDDLEBURY_PHOTO_PATHS.bathroomDetail,
    alt: "VelocityMaid bathroom deep cleaning in Middlebury Vermont",
    label: "Bathroom Detail Clean",
  },
  {
    src: MIDDLEBURY_PHOTO_PATHS.sideEntry,
    alt: "VelocityMaid property readiness service at Vermont rental entry",
    label: "Guest-Ready Setup",
  },
  {
    src: LUDLOW_PHOTO_PATHS.exteriorHero,
    alt: "VelocityMaid vacation rental exterior in Ludlow, VT",
    label: "Property Exterior",
    location: "Ludlow, VT",
  },
  {
    src: LUDLOW_PHOTO_PATHS.livingRoom,
    alt: "VelocityMaid vacation rental living room in Ludlow, VT",
    label: "Living Room Refresh",
    location: "Ludlow, VT",
  },
  {
    src: LUDLOW_PHOTO_PATHS.kitchen,
    alt: "VelocityMaid vacation rental kitchen in Ludlow, VT",
    label: "Kitchen Reset",
    location: "Ludlow, VT",
  },
  {
    src: LUDLOW_PHOTO_PATHS.bedroomMain,
    alt: "VelocityMaid vacation rental main bedroom in Ludlow, VT",
    label: "Bedroom Turnover",
    location: "Ludlow, VT",
  },
  {
    src: LUDLOW_PHOTO_PATHS.bathroomMain,
    alt: "VelocityMaid vacation rental main bathroom in Ludlow, VT",
    label: "Bathroom Detail Clean",
    location: "Ludlow, VT",
  },
  {
    src: PERKINSVILLE_PHOTO_PATHS.exteriorHero,
    alt: "VelocityMaid vacation rental exterior in Perkinsville, VT",
    label: "Property Exterior",
    location: "Perkinsville, VT",
  },
  {
    src: PERKINSVILLE_PHOTO_PATHS.livingRoom,
    alt: "VelocityMaid vacation rental living room in Perkinsville, VT",
    label: "Living Room Refresh",
    location: "Perkinsville, VT",
  },
  {
    src: PERKINSVILLE_PHOTO_PATHS.kitchen,
    alt: "VelocityMaid vacation rental kitchen in Perkinsville, VT",
    label: "Kitchen Reset",
    location: "Perkinsville, VT",
  },
  {
    src: PERKINSVILLE_PHOTO_PATHS.bedroomMain,
    alt: "VelocityMaid vacation rental bedroom in Perkinsville, VT",
    label: "Bedroom Turnover",
    location: "Perkinsville, VT",
  },
  {
    src: PERKINSVILLE_PHOTO_PATHS.bathroomMain,
    alt: "VelocityMaid vacation rental main bathroom in Perkinsville, VT",
    label: "Bathroom Detail Clean",
    location: "Perkinsville, VT",
  },
];

export const VERMONT_GALLERY_HEADLINE = "Real Vermont Properties. Guest-Ready Results.";

export const VERMONT_GALLERY_SUBHEADLINE =
  "From deep cleans to vacation rental turnovers, VelocityMaid helps Vermont homeowners and hosts prepare clean, welcoming spaces with professional care.";

export const VERMONT_GALLERY_TRUST_LINE =
  "Middlebury · Ludlow · Perkinsville, Vermont";
