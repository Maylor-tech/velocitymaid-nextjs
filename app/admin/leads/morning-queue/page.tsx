import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import MorningQueueClient from './components/MorningQueueClient';

export const metadata: Metadata = {
  title: 'Morning Queue - Leads | VelocityMaid Admin',
  description: 'View and manage leads waiting for morning follow-up',
};

export default async function MorningQueuePage() {
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

  // Get leads waiting for morning
  const waitingLeadsRaw = await prisma.lead.findMany({
    where: {
      branchId: branch.id,
      waitForMorning: true,
      status: { in: ['ACTIVE', 'NEW'] },
    },
    orderBy: [
      { createdAt: 'asc' },
    ],
    take: 100,
  });

  // Convert Date objects to ISO strings for client component
  const waitingLeads = waitingLeadsRaw.map(lead => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    zip: lead.zip,
    leadTier: lead.leadTier,
    leadScore: lead.leadScore,
    urgency: lead.urgency,
    afterHoursMessage: lead.afterHoursMessage,
    createdAt: lead.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Morning Queue - After-Hours Leads
          </h1>
          <p className="text-gray-600">
            Leads waiting for morning follow-up ({waitingLeads.length} waiting)
          </p>
        </div>

        <MorningQueueClient
          branchId={branch.id}
          initialLeads={waitingLeads}
        />
      </div>
    </div>
  );
}

