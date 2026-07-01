import { prisma } from '@/lib/prisma';

export async function getCustomerPortalStats(customerId: string) {
  const [customer, usedTokens] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { invitedAt: true },
    }),
    prisma.customerLoginToken.findMany({
      where: { customerId, used: true },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);

  return {
    portalInviteSent: customer?.invitedAt != null,
    inviteAccepted: usedTokens.length > 0,
    loginCount: usedTokens.length,
    lastPortalLoginAt: usedTokens[0]?.createdAt.toISOString() ?? null,
    invitedAt: customer?.invitedAt?.toISOString() ?? null,
  };
}
