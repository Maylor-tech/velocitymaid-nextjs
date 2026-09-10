import type { Metadata } from "next";
import { pageSocialMetadata } from "@/lib/seo/socialImages";

const title = "Our Work | VelocityMaid";
const description =
  "A curated look at real VelocityMaid property care — guest-ready Vermont homes and detailed residential presentation.";

export const metadata: Metadata = {
  title,
  description,
  ...pageSocialMetadata({
    title,
    description,
    path: "/gallery",
    image: "default",
  }),
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
