/**
 * Admin Payout Generation API
 * 
 * POST /api/admin/payout-shadow/run
 * 
 * Generates real JobPayout and TransactionLedger entries for eligible COMPLETED jobs.
 * NO money movement. All payouts marked as PENDING.
 * Idempotent: jobs processed once per policy version.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/requireRole";
import { generatePayouts } from "@/workers/generatePayouts";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/payout-shadow/run
 * 
 * Body: {
 *   days?: number;      // Default: 30
 *   maxJobs?: number;   // Default: 500
 *   branchId?: string;  // Optional branch filter
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[PAYOUT_API] Step 1: Authenticating admin...");
    await requireRole(request, "ADMIN");
    console.log("[PAYOUT_API] Step 2: Admin authenticated");

    console.log("[PAYOUT_API] Step 3: Parsing request body...");
    const body = await request.json().catch(() => ({}));
    const { days, maxJobs, branchId } = body;
    console.log("[PAYOUT_API] Step 4: Request body parsed", { days, maxJobs, branchId });

    console.log("[PAYOUT_API] Step 5: Calling generatePayouts worker...");
    // Generate payouts
    const result = await generatePayouts({
      days: days ? parseInt(String(days)) : undefined,
      maxJobs: maxJobs ? parseInt(String(maxJobs)) : undefined,
      branchId: branchId || undefined,
    });
    console.log("[PAYOUT_API] Step 6: generatePayouts completed", result);

    console.log("[PAYOUT_API] Step 7: Returning success response");
    return NextResponse.json({
      success: true,
      summary: {
        processed: result.processed,
        created: result.created,
        skipped_no_cleaner: result.skipped_no_cleaner,
        skipped_no_policy: result.skipped_no_policy,
        skipped_already_exists: result.skipped_already_exists,
        errors: result.errors,
      },
      errorDetails: result.errorDetails || [],
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('=== PAYOUT ERROR START ===');
    console.error('Error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Is Response:', error instanceof Response);
    console.error('Is Error:', error instanceof Error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Handle Response objects (thrown by requireRole)
    if (error instanceof Response) {
      try {
        const errorData = await error.json();
        console.error('Response error data:', errorData);
        console.error('=== PAYOUT ERROR END ===');
        return NextResponse.json({ 
          success: false, 
          error: errorData.error || errorData.message || 'Authentication failed' 
        }, { status: error.status || 500 });
      } catch (e) {
        console.error('Failed to parse Response error:', e);
        console.error('=== PAYOUT ERROR END ===');
        return NextResponse.json({ 
          success: false, 
          error: `Authentication error (status: ${error.status})` 
        }, { status: error.status || 500 });
      }
    }
    
    // Handle regular Error objects
    if (error instanceof Error) {
      console.error('=== PAYOUT ERROR END ===');
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Failed to generate payouts' 
      }, { status: 500 });
    }
    
    // Handle other error types
    console.error('=== PAYOUT ERROR END ===');
    return NextResponse.json({ 
      success: false, 
      error: String(error) || 'Unknown error occurred' 
    }, { status: 500 });
  }
}

/**
 * Verification SQL Queries (for dev/debugging):
 * 
 * -- Count total shadow results
 * select count(*) from "PayoutPolicyShadowResult";
 * 
 * -- Count by branch
 * select "branchId", count(*)
 * from "PayoutPolicyShadowResult"
 * group by "branchId"
 * order by count(*) desc;
 * 
 * -- Recent results
 * select *
 * from "PayoutPolicyShadowResult"
 * order by "createdAt" desc
 * limit 20;
 * 
 * -- Delta analysis
 * select 
 *   avg(delta) as avg_delta,
 *   min(delta) as min_delta,
 *   max(delta) as max_delta,
 *   count(*) as total
 * from "PayoutPolicyShadowResult";
 */

