import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get a Free Quote | VelocityMaid New Jersey",
  description:
    "Request a quote for residential cleaning in our Essex County service area. Bloomfield, Montclair, Newark, and nearby towns.",
};

export default function NewJerseyLeadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
