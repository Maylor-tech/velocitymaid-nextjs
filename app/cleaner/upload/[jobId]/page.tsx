export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import CleanerUploadClient from "./CleanerUploadClient";

/**
 * Public, no-login photo upload page for cleaners.
 * The unguessable job ID in the URL is the access key.
 */
export default async function CleanerUploadPage({
  params,
}: {
  params: { jobId: string };
}) {
  const { jobId } = params;

  const job = jobId
    ? await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, address: true },
      })
    : null;

  if (!job) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vm-surface p-6">
        <div className="w-full max-w-sm rounded-2xl border border-vm-border bg-vm-white p-8 text-center">
          <h1 className="font-heading text-xl font-semibold text-vm-navy">
            Link not valid
          </h1>
          <p className="mt-2 font-body text-sm text-vm-muted">
            This upload link doesn&apos;t match a job. Please check the link your
            manager sent you, or reach out for a new one.
          </p>
        </div>
      </div>
    );
  }

  return <CleanerUploadClient jobId={job.id} address={job.address} />;
}
