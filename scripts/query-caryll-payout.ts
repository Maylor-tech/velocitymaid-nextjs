import { prisma } from '../lib/prisma';

async function main() {
  const job = await prisma.job.findFirst({
    where: { customerName: { contains: 'Caryll' } },
    include: {
      JobPayout: true,
      User: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(
    JSON.stringify(
      {
        id: job?.id,
        status: job?.status,
        paymentStatus: job?.paymentStatus,
        assignedCleaner: job?.User,
        JobPayout: job?.JobPayout
          ? {
              ...job.JobPayout,
              grossAmount: Number(job.JobPayout.grossAmount),
              cleanerAmount: Number(job.JobPayout.cleanerAmount),
              platformFee: Number(job.JobPayout.platformFee),
            }
          : null,
      },
      null,
      2
    )
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
