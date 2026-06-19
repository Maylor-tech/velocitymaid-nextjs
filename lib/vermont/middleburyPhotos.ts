/** Middlebury property photos — public/images/vermont/ */
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

export interface VermontGalleryPhoto {
  src: string;
  alt: string;
  label: string;
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
];

export const VERMONT_GALLERY_HEADLINE = "Real Vermont Properties. Guest-Ready Results.";

export const VERMONT_GALLERY_SUBHEADLINE =
  "From deep cleans to vacation rental turnovers, VelocityMaid helps Vermont homeowners and hosts prepare clean, welcoming spaces with professional care.";

export const VERMONT_GALLERY_TRUST_LINE =
  "Middlebury, Vermont · Deep Clean · Property Readiness";
