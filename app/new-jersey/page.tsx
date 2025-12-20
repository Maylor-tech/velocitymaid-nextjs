// app/new-jersey/page.tsx
// Redirect to dynamic locations/new-jersey page

import { redirect } from 'next/navigation';

export default function NewJerseyPage() {
  redirect('/locations/new-jersey');
}
