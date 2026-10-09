import { redirect } from "next/navigation";
import { VERMONT_WORK_WITH_US_PATH } from "@/lib/marketing/publicCtas";

export default function CareersPage() {
  redirect(VERMONT_WORK_WITH_US_PATH);
}
