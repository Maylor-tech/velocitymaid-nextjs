export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { seedAllBranchesDb } from '@/utils/seedBranchesDb';

/**
 * Seed Branches API
 * 
 * POST /api/admin/branches/seed
 * 
 * Seeds all VelocityMaid branches with complete configuration into the database
 */
export async function POST(request: NextRequest) {
  try {
    // Allow seeding with a secret key from environment variable (for one-time setup)
    const secretKey = request.headers.get('x-seed-secret');
    const expectedSecret = process.env.BRANCH_SEED_SECRET;
    
    if (expectedSecret && secretKey === expectedSecret) {
      // Bypass auth if secret key matches
      console.log('Branch seeding authorized via secret key');
    } else {
      // Otherwise require admin authentication
      await requireRole(request, "ADMIN");
    }
    
    const result = await seedAllBranchesDb();
    
    return NextResponse.json({
      success: true,
      message: 'All branches seeded successfully',
      branches: {
        newJersey: {
          id: result.newJersey.id,
          slug: result.newJersey.slug,
          name: result.newJersey.name,
          country: result.newJersey.country,
          status: result.newJersey.status,
        },
        vermont: {
          id: result.vermont.id,
          slug: result.vermont.slug,
          name: result.vermont.name,
          country: result.vermont.country,
          status: result.vermont.status,
        },
        portAntonio: {
          id: result.portAntonio.id,
          slug: result.portAntonio.slug,
          name: result.portAntonio.name,
          country: result.portAntonio.country,
          status: result.portAntonio.status,
        },
      },
    });
  } catch (error: any) {
    console.error('Seed branches error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed branches' },
      { status: 500 }
    );
  }
}




