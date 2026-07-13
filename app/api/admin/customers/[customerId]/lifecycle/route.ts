export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import {
  archiveCustomer,
  permanentlyDeleteCustomer,
  restoreCustomer,
  DELETE_BLOCKED_MESSAGE,
} from '@/lib/admin/customerLifecycle';

type Action = 'archive' | 'restore' | 'delete';

export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const { customerId } = params;
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'customerId is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action as Action;

    if (action !== 'archive' && action !== 'restore' && action !== 'delete') {
      return NextResponse.json(
        { success: false, error: 'action must be archive, restore, or delete' },
        { status: 400 }
      );
    }

    const actor = {
      actorId: auth.userId?.startsWith('legacy') ? null : auth.userId,
      actorEmail: auth.email ?? null,
    };

    if (action === 'archive') {
      const customer = await archiveCustomer({ customerId, ...actor });
      return NextResponse.json({ success: true, action, customer });
    }

    if (action === 'restore') {
      const customer = await restoreCustomer({ customerId, ...actor });
      return NextResponse.json({ success: true, action, customer });
    }

    const result = await permanentlyDeleteCustomer({ customerId, ...actor });
    if (!result.deleted) {
      return NextResponse.json(
        {
          success: false,
          error: DELETE_BLOCKED_MESSAGE,
          blockers: result.blockers,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, action: 'delete', deleted: true });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message =
      error instanceof Error ? error.message : 'Customer lifecycle action failed';
    const status = message === 'Customer not found' ? 404 : 500;
    console.error('[customer lifecycle]', error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
