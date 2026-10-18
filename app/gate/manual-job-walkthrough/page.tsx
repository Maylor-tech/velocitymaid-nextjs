import { notFound } from "next/navigation";
import { ManualJobWalkthrough } from "./walkthrough";

export const dynamic = "force-dynamic";

/** Local gate page. Production builds do not serve it. */
export default function ManualJobWalkthroughPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ManualJobWalkthrough />;
}
