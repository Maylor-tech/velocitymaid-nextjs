import type { Metadata } from 'next';
import { HostPhotoReport } from '@/components/reports/HostPhotoReport';
import { loadHostPhotoReport } from '@/lib/reports/loadHostPhotoReport';

export const dynamic = 'force-dynamic';

const NOINDEX: Metadata = {
  title: 'Report | VelocityMaid',
  robots: { index: false, follow: false, nocache: true },
};

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  const report = await loadHostPhotoReport(params.token);
  if (!report) return NOINDEX;
  return {
    title: `${report.propertyName} · VelocityMaid`,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function PublicReportPage({
  params,
}: {
  params: { token: string };
}) {
  const report = await loadHostPhotoReport(params.token);
  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vm-canvas p-6">
        <p className="font-body text-sm text-vm-text">Report not found.</p>
      </div>
    );
  }
  return <HostPhotoReport report={report} />;
}
