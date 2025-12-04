import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import LeadManagementClient from './components/LeadManagementClient';

export const metadata: Metadata = {
  title: 'Lead Management - New Jersey | VelocityMaid Admin',
  description: 'Manage and qualify leads for New Jersey branch',
};

export default async function AdminLeadsNJPage() {
  const branch = await prisma.branch.findUnique({
    where: { slug: 'new-jersey' },
  });

  if (!branch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Branch not found</p>
      </div>
    );
  }

  // Get leads
  const leadsRaw = await prisma.lead.findMany({
    where: { branchId: branch.id },
    orderBy: [
      { leadScore: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 100,
  });

  // Convert Date objects to ISO strings for client component
  const leads = leadsRaw.map(lead => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    zip: lead.zip,
    bedrooms: lead.bedrooms,
    bathrooms: lead.bathrooms,
    urgency: lead.urgency,
    homeType: lead.homeType,
    leadScore: lead.leadScore,
    leadTier: lead.leadTier,
    riskFlags: lead.riskFlags,
    status: lead.status,
    depositPaid: lead.depositPaid,
    createdAt: lead.createdAt.toISOString(),
  }));

  // Get stats
  const stats = {
    total: leads.length,
    tierA: leads.filter(l => l.leadTier === 'A').length,
    tierB: leads.filter(l => l.leadTier === 'B').length,
    tierC: leads.filter(l => l.leadTier === 'C').length,
    new: leads.filter(l => l.status === 'NEW').length,
    active: leads.filter(l => l.status === 'ACTIVE').length,
    qualified: leads.filter(l => l.status === 'QUALIFIED').length,
    rejected: leads.filter(l => l.status === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lead Management - New Jersey
          </h1>
          <p className="text-gray-600">
            Manage and qualify leads for the New Jersey branch
          </p>
        </div>

        <LeadManagementClient
          branchId={branch.id}
          initialLeads={leads}
          initialStats={stats}
        />
      </div>
    </div>
  );
}

