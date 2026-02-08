import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { type CustomerProfile } from '@/lib/types/customerProfile';
import { getCustomerSession } from '@/lib/customerSession';
import { sendAccountUpdateNotice } from '@/lib/notifications/accountUpdateNotice';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/customer/profile
 * 
 * Get current customer profile
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getCustomerSession();

    if (!session || !session.customerId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      );
    }

    const profile: CustomerProfile = {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      addressLine1: customer.addressLine1,
      addressLine2: customer.addressLine2,
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
      notifyEmail: customer.notifyEmail ?? true,
      notifySMS: customer.notifySMS ?? false,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error loading customer profile:', error);
    return NextResponse.json(
      { error: 'Failed to load profile' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/customer/profile
 * 
 * Update customer profile
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getCustomerSession();

    if (!session || !session.customerId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();

    // Pull only allowed fields
    const {
      firstName,
      lastName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      notifyEmail,
      notifySMS,
    } = body ?? {};

    // Basic validation — keep it simple, front-end will do more
    const updates: Record<string, any> = {};

    if (typeof firstName === 'string') updates.firstName = firstName.trim() || null;
    if (typeof lastName === 'string') updates.lastName = lastName.trim() || null;
    if (typeof phone === 'string') updates.phone = phone.trim() || null;
    if (typeof addressLine1 === 'string') updates.addressLine1 = addressLine1.trim() || null;
    if (typeof addressLine2 === 'string') updates.addressLine2 = addressLine2.trim() || null;
    if (typeof city === 'string') updates.city = city.trim() || null;
    if (typeof state === 'string') updates.state = state.trim() || null;
    if (typeof postalCode === 'string') updates.postalCode = postalCode.trim() || null;

    if (typeof notifyEmail === 'boolean') updates.notifyEmail = notifyEmail;
    if (typeof notifySMS === 'boolean') updates.notifySMS = notifySMS;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 },
      );
    }

    const current = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        notifyEmail: true,
        notifySMS: true,
      },
    });
    if (!current) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const materialUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      const cur = (current as Record<string, any>)[key];
      const a = cur == null ? null : (typeof cur === 'boolean' ? cur : String(cur).trim());
      const b = value == null ? null : (typeof value === 'boolean' ? value : String(value).trim());
      if (a !== b) materialUpdates[key] = updates[key];
    }
    if (Object.keys(materialUpdates).length === 0) {
      const profile: CustomerProfile = {
        id: current.id,
        email: current.email,
        firstName: current.firstName,
        lastName: current.lastName,
        phone: current.phone,
        addressLine1: current.addressLine1,
        addressLine2: current.addressLine2,
        city: current.city,
        state: current.state,
        postalCode: current.postalCode,
        notifyEmail: current.notifyEmail ?? true,
        notifySMS: current.notifySMS ?? false,
      };
      return NextResponse.json({ profile });
    }

    const updated = await prisma.customer.update({
      where: { id: session.customerId },
      data: materialUpdates,
    });

    sendAccountUpdateNotice(session.customerId).catch(() => {});

    const profile: CustomerProfile = {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      addressLine1: updated.addressLine1,
      addressLine2: updated.addressLine2,
      city: updated.city,
      state: updated.state,
      postalCode: updated.postalCode,
      notifyEmail: updated.notifyEmail ?? true,
      notifySMS: updated.notifySMS ?? false,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    );
  }
}
