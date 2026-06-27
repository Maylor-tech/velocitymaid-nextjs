import type { Metadata } from "next";
import VermontClusterLanding from "@/components/vermont/VermontClusterLanding";
import { VERMONT_CLUSTERS } from "@/lib/vermont/clusters";
import { MIDDLEBURY_PHOTO_PATHS } from "@/lib/vermont/middleburyPhotos";

const cluster = VERMONT_CLUSTERS.okemo;

export const metadata: Metadata = {
  title: cluster.metadata.title,
  description: cluster.metadata.description,
  keywords: cluster.metadata.keywords,
  openGraph: {
    title: cluster.metadata.title,
    description: cluster.metadata.openGraphDescription,
    images: [
      {
        url: MIDDLEBURY_PHOTO_PATHS.bedroomLoft,
        width: 1200,
        height: 630,
        alt: cluster.heroImageAlt,
      },
    ],
  },
};

export default function OkemoValleyPage() {
  return <VermontClusterLanding cluster={cluster} />;
}
