import { NextRequest, NextResponse } from 'next/server';
import { validateSaaSEnv } from '@/lib/env/validate';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';

/**
 * Health check endpoint for production monitoring
 * 
 * GET /api/health
 */
export async function GET(req: NextRequest) {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {};
  let overallStatus = 'ok';

  // Check environment variables
  try {
    const envCheck = validateSaaSEnv();
    if (!envCheck.valid) {
      checks.env = {
        status: 'error',
        message: `Missing: ${envCheck.missing.join(', ')}`,
      };
      overallStatus = 'error';
    } else if (envCheck.warnings.length > 0) {
      checks.env = {
        status: 'ok',
        message: `Warnings: ${envCheck.warnings.join(', ')}`,
      };
    } else {
      checks.env = { status: 'ok' };
    }
  } catch (error: any) {
    checks.env = { status: 'error', message: error.message };
    overallStatus = 'error';
  }

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok' };
  } catch (error: any) {
    checks.database = { status: 'error', message: error.message };
    overallStatus = 'error';
  }

  // Check Stripe connection
  try {
    const stripe = getStripe();
    await stripe.customers.list({ limit: 1 });
    checks.stripe = { status: 'ok' };
  } catch (error: any) {
    checks.stripe = { status: 'error', message: error.message };
    // Don't fail overall if Stripe fails (might be test mode)
  }

  const statusCode = overallStatus === 'ok' ? 200 : 503;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: statusCode }
  );
}
