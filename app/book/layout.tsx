import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageSocialMetadata } from "@/lib/seo/socialImages";

const title = "Book Cleaning | VelocityMaid";
const description =
  "Book professional home and vacation-rental cleaning with VelocityMaid in New Jersey and Vermont.";

export const metadata: Metadata = {
  title,
  description,
  ...pageSocialMetadata({
    title,
    description,
    path: "/book",
    image: "default",
  }),
};

export default function BookLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
