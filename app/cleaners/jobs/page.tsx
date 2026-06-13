import { redirect } from 'next/navigation';

/** Legacy path — job portal lives at /cleaner/jobs */
export default function CleanersJobsRedirect() {
  redirect('/cleaner/jobs');
}
