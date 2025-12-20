import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client with connection limits for Supabase Free Tier
 * 
 * Note: For connection pooling, add these parameters to your DATABASE_URL:
 * - ?connection_limit=5&pool_timeout=10
 * 
 * Example:
 * DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=5&pool_timeout=10&sslmode=require"
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Handle connection errors gracefully
prisma.$connect().catch((error) => {
  console.error('Prisma connection error:', error);
});

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}




