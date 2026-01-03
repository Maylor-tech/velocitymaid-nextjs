/**
 * Apply missing timestamp columns to ContactMessage table in production
 * 
 * This script applies the SQL from migration 20250103000008_add_message_timestamps
 * directly to fix the P2022 error.
 * 
 * Usage:
 *   node scripts/apply-contact-timestamps.js
 * 
 * Requires:
 *   - DATABASE_URL environment variable set to production database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyTimestamps() {
  try {
    console.log('Applying missing timestamp columns to ContactMessage...');
    
    // Apply the SQL from the migration
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP(3);
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
    `);
    
    console.log('✅ Successfully added timestamp columns');
    
    // Verify columns exist
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ContactMessage'
      AND column_name IN ('reviewedAt', 'repliedAt', 'archivedAt')
      ORDER BY column_name;
    `);
    
    console.log('\n📋 Verified columns:');
    console.table(columns);
    
    console.log('\n✅ Migration complete! Contact form should now work.');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyTimestamps();

