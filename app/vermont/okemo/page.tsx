import type { Metadata } from "next";
import VermontClusterLanding from "@/components/vermont/VermontClusterLanding";
import { VERMONT_CLUSTERS } from "@/lib/vermont/clusters";
import { pageSocialMetadata } from "@/lib/seo/socialImages";

const cluster = VERMONT_CLUSTERS.okemo;

export const metadata: Metadata = {
  title: cluster.metadata.title,
  description: cluster.metadata.description,
  keywords: cluster.metadata.keywords,
  ...pageSocialMetadata({
    title: cluster.metadata.title,
    description: cluster.metadata.openGraphDescription,
    path: "/vermont/okemo",
    image: "vermont",
  }),
};

export default function OkemoValleyPage() {
  return <VermontClusterLanding cluster={cluster} />;
}
