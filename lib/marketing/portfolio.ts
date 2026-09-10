export const TDS_DENIED_FILENAMES = [
  "IMG_9468",
  "IMG_9470",
] as const;

export type PortfolioCategory =
  | "Guest-Ready Spaces"
  | "Vermont Property Care"
  | "Detail & Presentation";

export type PortfolioImage = {
  src: string;
  alt: string;
  caption: string;
  category: PortfolioCategory;
  sourceId: string;
};

export const PORTFOLIO = {
  vermontLivingRoom: {
    src: "/images/portfolio/vermont/velocitymaid-vermont-guest-ready-living-room.jpg",
    alt: "Pine-paneled living room with seating and a wood stove after a VelocityMaid Vermont reset",
    caption: "Guest-ready living room",
    category: "Guest-Ready Spaces",
    sourceId: "IMG_9632",
  },
  vermontLoft: {
    src: "/images/portfolio/vermont/velocitymaid-vermont-open-living-loft.jpg",
    alt: "Overhead view of a guest-ready living, dining, and kitchen space in a Vermont rental",
    caption: "Open living and dining",
    category: "Guest-Ready Spaces",
    sourceId: "IMG_9571",
  },
  vermontCoffeeBar: {
    src: "/images/portfolio/vermont/velocitymaid-vermont-guest-coffee-bar.jpg",
    alt: "Guest coffee bar with glassware, mugs, and coffee service staged after VelocityMaid preparation",
    caption: "Guest coffee bar",
    category: "Detail & Presentation",
    sourceId: "IMG_9603",
  },
  vermontStudioSuite: {
    src: "/images/portfolio/vermont/velocitymaid-vermont-studio-guest-suite.jpg",
    alt: "Studio guest suite with made bed, sitting area, and wood stove after a Vermont turnover",
    caption: "Studio guest suite",
    category: "Guest-Ready Spaces",
    sourceId: "IMG_9634",
  },
  vermontBedroomReset: {
    src: "/images/portfolio/vermont/velocitymaid-vermont-bedroom-living-reset.jpg",
    alt: "Bedroom opening onto a living area after a Vermont guest reset",
    caption: "Bedroom and living reset",
    category: "Detail & Presentation",
    sourceId: "IMG_9625",
  },
  vermontGameTable: {
    src: "/images/portfolio/vermont/velocitymaid-vermont-game-table-reset.jpg",
    alt: "Cleared game table and floors in a Vermont vacation rental after service",
    caption: "Game table reset",
    category: "Detail & Presentation",
    sourceId: "IMG_9633",
  },
  vermontLivingDetail: {
    src: "/images/portfolio/vermont/velocitymaid-vermont-living-detail.jpg",
    alt: "Living-room wall and wood stove detail in a Vermont rental after VelocityMaid service",
    caption: "Living-room detail",
    category: "Detail & Presentation",
    sourceId: "IMG_9631",
  },
  middleburyDeck: {
    src: "/images/portfolio/middlebury/velocitymaid-middlebury-deck.jpg",
    alt: "Outdoor deck with seating under a pergola after VelocityMaid property care in Middlebury",
    caption: "Deck with pergola",
    category: "Vermont Property Care",
    sourceId: "100_0176",
  },
  middleburyReadingRoom: {
    src: "/images/portfolio/middlebury/velocitymaid-middlebury-reading-room.jpg",
    alt: "Reading room with bay window, bookshelves, and clear surfaces after VelocityMaid care in Middlebury",
    caption: "Reading room",
    category: "Vermont Property Care",
    sourceId: "IMG_6932",
  },
  middleburyPorch: {
    src: "/images/portfolio/middlebury/velocitymaid-middlebury-porch.jpg",
    alt: "Covered porch with a chair, table, and planter after VelocityMaid property care in Middlebury",
    caption: "Front porch",
    category: "Vermont Property Care",
    sourceId: "IMG_6901",
  },
  middleburyLivingRoom: {
    src: "/images/portfolio/middlebury/velocitymaid-middlebury-living-room.jpg",
    alt: "Formal living room with sofa and piano after VelocityMaid property care in Middlebury",
    caption: "Formal living room",
    category: "Vermont Property Care",
    sourceId: "100_0169",
  },
  middleburySunporch: {
    src: "/images/portfolio/middlebury/velocitymaid-middlebury-sunporch.jpg",
    alt: "Sunporch seating after VelocityMaid property care in Middlebury",
    caption: "Sunporch",
    category: "Detail & Presentation",
    sourceId: "IMG_6957",
  },
} as const satisfies Record<string, PortfolioImage>;

export const PORTFOLIO_IMAGES: readonly PortfolioImage[] = Object.values(PORTFOLIO);

/** Near-duplicate or weaker cabin/sunporch frames — kept on disk, not shown this release. */
export const GALLERY_WITHHELD_SOURCE_IDS = [
  "IMG_9633",
  "IMG_9631",
  "IMG_6957",
  "IMG_9625",
] as const;

export const GALLERY_CATEGORIES: readonly ["All", ...PortfolioCategory[]] = [
  "All",
  "Guest-Ready Spaces",
  "Vermont Property Care",
  "Detail & Presentation",
];

/** Curated public gallery — eight strongest, distinct-property frames. */
export const GALLERY_IMAGES: readonly PortfolioImage[] = [
  PORTFOLIO.vermontLivingRoom,
  PORTFOLIO.vermontLoft,
  PORTFOLIO.vermontCoffeeBar,
  PORTFOLIO.vermontStudioSuite,
  PORTFOLIO.middleburyDeck,
  PORTFOLIO.middleburyReadingRoom,
  PORTFOLIO.middleburyPorch,
  PORTFOLIO.middleburyLivingRoom,
];

export const HOMEPAGE_PROOF = {
  featured: PORTFOLIO.vermontLivingRoom,
  supporting: [PORTFOLIO.middleburyReadingRoom, PORTFOLIO.middleburyDeck],
} as const;

export const VERMONT_PROOF = {
  featured: PORTFOLIO.vermontStudioSuite,
  supporting: [PORTFOLIO.middleburyDeck, PORTFOLIO.middleburyReadingRoom],
} as const;

export const MIDDLEBURY_PROOF = {
  featured: PORTFOLIO.middleburyReadingRoom,
  supporting: [PORTFOLIO.middleburyPorch, PORTFOLIO.middleburyLivingRoom],
} as const;

/** Loft overview plus coffee-bar staging — not a second living-room angle. */
export const TURNOVER_PROOF = {
  featured: PORTFOLIO.vermontLoft,
  supporting: [PORTFOLIO.vermontCoffeeBar],
} as const;

export const PUBLIC_PROOF_IMAGES: readonly PortfolioImage[] = [
  ...GALLERY_IMAGES,
  HOMEPAGE_PROOF.featured,
  ...HOMEPAGE_PROOF.supporting,
  VERMONT_PROOF.featured,
  ...VERMONT_PROOF.supporting,
  MIDDLEBURY_PROOF.featured,
  ...MIDDLEBURY_PROOF.supporting,
  TURNOVER_PROOF.featured,
  ...TURNOVER_PROOF.supporting,
];

export const PUBLIC_ADDRESS_DENYLIST = [
  "thomson",
  "chipman",
  "bear hill",
  "354 ",
  "198 ",
] as const;
