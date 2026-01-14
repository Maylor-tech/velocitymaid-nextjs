/**
 * Direct Database Branch Seeding Script
 * 
 * This script seeds branches directly into the database without going through the API.
 * Run with: npx tsx scripts/seed-branches-db.ts
 */

import { seedAllBranchesDb } from '../utils/seedBranchesDb';

async function main() {
  try {
    console.log('🌱 Starting branch seeding...\n');
    await seedAllBranchesDb();
    console.log('\n✅ All done! Your booking forms should now work.');
    console.log('\n📋 Next steps:');
    console.log('   1. Visit your booking page: /book');
    console.log('   2. Select "United States" → should see New Jersey and Vermont');
    console.log('   3. Select "Jamaica" → should see Port Antonio');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error seeding branches:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
