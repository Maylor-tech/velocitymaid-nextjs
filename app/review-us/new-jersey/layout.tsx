// Route segment config to prevent static generation timeout
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

