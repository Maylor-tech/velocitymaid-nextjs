import { MIDDLEBURY_PHOTO_PATHS } from "@/lib/vermont/middleburyPhotos";

export type VermontClusterSlug = "okemo" | "middlebury";

export interface VermontClusterConfig {
  slug: VermontClusterSlug;
  path: `/vermont/${VermontClusterSlug}`;
  navLabel: string;
  eyebrow: string;
  headline: string;
  heroDescription: string;
  heroImage: string;
  heroImageAlt: string;
  heroLocationLabel: string;
  heroLocationSub: string;
  serviceAreaIntro: string;
  serviceAreas: string[];
  footerServing: string;
  galleryRegionLabel: string;
  galleryHeadline: string;
  gallerySubheadline: string;
  galleryTrustLine: string;
  metadata: {
    title: string;
    description: string;
    keywords: string;
    openGraphDescription: string;
  };
}

export const VERMONT_CLUSTERS: Record<VermontClusterSlug, VermontClusterConfig> = {
  okemo: {
    slug: "okemo",
    path: "/vermont/okemo",
    navLabel: "Okemo Valley",
    eyebrow: "Okemo Valley · Vermont",
    headline: "Okemo Valley's Vacation Rental Cleaning Specialists",
    heroDescription:
      "Turnover-ready cleans for ski rentals, Airbnbs, and second homes across the Okemo Valley. VelocityMaid helps remote owners manage confidently — from deep cleans to between-guest turnovers.",
    heroImage: MIDDLEBURY_PHOTO_PATHS.bedroomLoft,
    heroImageAlt:
      "VelocityMaid vacation rental bedroom turnover in the Okemo Valley",
    heroLocationLabel: "Okemo Valley, Vermont",
    heroLocationSub: "Ski rental · Vacation turnover",
    serviceAreaIntro:
      "VelocityMaid serves Ludlow, Proctorsville, Cavendish, Chester, and the wider Okemo Valley:",
    serviceAreas: [
      "Ludlow",
      "Proctorsville",
      "Cavendish",
      "Chester",
      "Okemo Valley",
    ],
    footerServing:
      "Serving: Ludlow, Proctorsville, Cavendish, Chester, and Okemo Valley.",
    galleryRegionLabel: "Okemo Valley, Vermont",
    galleryHeadline: "Real Okemo Valley Rentals. Guest-Ready Results.",
    gallerySubheadline:
      "From ski-season turnovers to deep cleans between bookings, VelocityMaid prepares Okemo Valley properties for every arrival.",
    galleryTrustLine: "Okemo Valley · Turnover · Vacation Rental Cleaning",
    metadata: {
      title:
        "Okemo Valley Vacation Rental Cleaning | VelocityMaid — Ludlow & Ludlow Area",
      description:
        "VelocityMaid offers turnover cleaning, deep cleans, and property readiness for Okemo Valley vacation rentals in Ludlow, Proctorsville, Cavendish, Chester, and nearby communities.",
      keywords:
        "Okemo Valley cleaning, vacation rental cleaning Ludlow VT, Airbnb turnover Okemo, ski rental cleaning Vermont, Ludlow VT cleaning, Proctorsville cleaning, Cavendish cleaning, Chester VT cleaning, short-term rental cleaning Okemo",
      openGraphDescription:
        "Professional turnover and deep cleaning for Okemo Valley Airbnbs, ski rentals, and second homes.",
    },
  },
  middlebury: {
    slug: "middlebury",
    path: "/vermont/middlebury",
    navLabel: "Middlebury",
    eyebrow: "Middlebury · Addison County · Vermont",
    headline: "Middlebury's Trusted Property Readiness Partner",
    heroDescription:
      "Real properties. Guest-ready results. VelocityMaid helps Middlebury hosts and homeowners prepare clean, welcoming spaces — from deep cleans to between-guest turnovers.",
    heroImage: MIDDLEBURY_PHOTO_PATHS.exteriorHero,
    heroImageAlt:
      "VelocityMaid Vermont vacation rental exterior in Middlebury",
    heroLocationLabel: "Middlebury, Vermont",
    heroLocationSub: "Vacation rental · Property readiness",
    serviceAreaIntro:
      "VelocityMaid serves Middlebury and surrounding Addison County communities:",
    serviceAreas: [
      "Middlebury",
      "Bristol",
      "Vergennes",
      "Brandon",
      "Addison County",
    ],
    footerServing:
      "Serving: Middlebury and surrounding Addison County, Vermont.",
    galleryRegionLabel: "Middlebury, Vermont",
    galleryHeadline: "Real Vermont Properties. Guest-Ready Results.",
    gallerySubheadline:
      "From deep cleans to vacation rental turnovers, VelocityMaid helps Vermont homeowners and hosts prepare clean, welcoming spaces with professional care.",
    galleryTrustLine: "Middlebury, Vermont · Deep Clean · Property Readiness",
    metadata: {
      title:
        "Middlebury Property Readiness & Cleaning | VelocityMaid — Addison County",
      description:
        "VelocityMaid offers turnover cleaning, deep cleans, and property readiness for Middlebury vacation rentals and second homes across Addison County, Vermont.",
      keywords:
        "Middlebury cleaning services, Addison County cleaning, Airbnb turnover Middlebury VT, vacation rental cleaning Middlebury, property readiness Vermont, second home cleaning Middlebury, deep cleaning Addison County",
      openGraphDescription:
        "Professional turnover and deep cleaning for Middlebury Airbnbs, vacation rentals, and second homes.",
    },
  },
};

export const VERMONT_CLUSTER_LIST = Object.values(VERMONT_CLUSTERS);
