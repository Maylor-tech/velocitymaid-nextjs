import { redirect } from 'next/navigation';

/** Legacy path — job detail lives at /cleaner/jobs/[jobId] */
export default function CleanersJobDetailRedirect({
  params,
}: {
  params: { jobId: string };
}) {
  redirect(`/cleaner/jobs/${params.jobId}`);
}
