import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

/** Short unique public Zelle/memo reference, e.g. VM-TIP-AB12CD. */
export async function allocateTipInternalReference(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    const ref = `VM-TIP-${suffix}`;
    const existing = await prisma.tip.findUnique({
      where: { internalReference: ref },
      select: { id: true },
    });
    if (!existing) return ref;
  }
  throw new Error('Could not allocate a unique tip reference');
}
