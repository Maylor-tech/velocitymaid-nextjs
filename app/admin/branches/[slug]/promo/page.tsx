import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PromoManagementClient from './components/PromoManagementClient';

export const metadata: Metadata = {
  title: 'Monthly Promo Management | VelocityMaid Admin',
  description: 'Manage monthly promotional campaigns for branches',
};

export default async function BranchPromoPage({
  params,
}: {
  params: { slug: string };
}) {
  const branch = await prisma.branch.findUnique({
    where: { slug: params.slug },
  });

  if (!branch) {
    notFound();
  }

  // Get current promo
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  const currentPromo = await prisma.promo.findUnique({
    where: {
      branchId_month_year: {
        branchId: branch.id,
        month: currentMonth,
        year: currentYear,
      },
    },
  });

  // Get all promos for this branch
  const allPromosRaw = await prisma.promo.findMany({
    where: { branchId: branch.id },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    take: 12, // Last 12 months
  });

  // Convert Date objects to ISO strings for client component
  const allPromos = allPromosRaw.map(promo => ({
    ...promo,
    startDate: promo.startDate.toISOString(),
    endDate: promo.endDate.toISOString(),
  }));

  const currentPromoFormatted = currentPromo ? {
    ...currentPromo,
    startDate: currentPromo.startDate.toISOString(),
    endDate: currentPromo.endDate.toISOString(),
  } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Monthly Promo Management
          </h1>
          <p className="text-gray-600">
            {branch.name} ({branch.slug})
          </p>
        </div>

        <PromoManagementClient
          branchId={branch.id}
          branchSlug={branch.slug}
          currentPromo={currentPromoFormatted}
          allPromos={allPromos}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />
      </div>
    </div>
  );
}

