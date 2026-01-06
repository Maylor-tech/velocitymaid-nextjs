import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

/**
 * Logout SaaS user
 * 
 * POST /api/saas/logout
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('saas_user_id');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[SAAS LOGOUT] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}

