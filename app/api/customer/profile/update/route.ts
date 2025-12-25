import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readCustomerSession } from '@/lib/customerSession';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/customer/profile/update
 * 
 * Update customer profile fields: firstName, lastName, phone, defaultAddress
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await readCustomerSession();

    if (!session || !session.customerId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, phone, defaultAddress } = body ?? {};

    // Validation
    const errors: string[] = [];

    // Validate firstName
    if (firstName !== undefined) {
      if (typeof firstName !== 'string') {
        errors.push('firstName must be a string');
      } else {
        const trimmed = firstName.trim();
        if (trimmed.length < 2) {
          errors.push('firstName must be at least 2 characters');
        } else if (trimmed.length > 100) {
          errors.push('firstName must be less than 100 characters');
        }
      }
    }

    // Validate lastName
    if (lastName !== undefined) {
      if (typeof lastName !== 'string') {
        errors.push('lastName must be a string');
      } else {
        const trimmed = lastName.trim();
        if (trimmed.length > 0 && trimmed.length < 2) {
          errors.push('lastName must be at least 2 characters if provided');
        } else if (trimmed.length > 100) {
          errors.push('lastName must be less than 100 characters');
        }
      }
    }

    // Validate phone
    if (phone !== undefined) {
      if (phone !== null && typeof phone !== 'string') {
        errors.push('phone must be a string or null');
      } else if (phone !== null && phone.trim().length > 0) {
        const phoneRegex = /^[0-9()+\-\s]{7,20}$/;
        if (!phoneRegex.test(phone.trim())) {
          errors.push('phone must match format: 7-20 digits, spaces, dashes, parentheses, or plus sign');
        }
      }
    }

    // Validate defaultAddress
    if (defaultAddress !== undefined) {
      if (defaultAddress !== null && typeof defaultAddress !== 'string') {
        errors.push('defaultAddress must be a string or null');
      } else if (defaultAddress !== null && defaultAddress.trim().length > 0) {
        const trimmed = defaultAddress.trim();
        if (trimmed.length < 5) {
          errors.push('defaultAddress must be at least 5 characters if provided');
        } else if (trimmed.length > 500) {
          errors.push('defaultAddress must be less than 500 characters');
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join('; ') },
        { status: 400 },
      );
    }

    // Build update object - only include fields that were provided
    const updates: Record<string, any> = {};

    if (firstName !== undefined) {
      updates.firstName = firstName.trim() || null;
    }
    if (lastName !== undefined) {
      updates.lastName = lastName.trim() || null;
    }
    if (phone !== undefined) {
      updates.phone = phone && phone.trim().length > 0 ? phone.trim() : null;
    }
    if (defaultAddress !== undefined) {
      updates.defaultAddress = defaultAddress && defaultAddress.trim().length > 0 ? defaultAddress.trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 },
      );
    }

    // Find customer by session.customerId (security: never trust client-provided customerId)
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      );
    }

    // Update ONLY allowed fields (firstName, lastName, phone, defaultAddress)
    // DO NOT update: email, id, createdAt, or any relations
    const updated = await prisma.customer.update({
      where: { id: session.customerId },
      data: updates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        defaultAddress: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      customer: updated,
    });
  } catch (error: any) {
    console.error('Error updating customer profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 },
    );
  }
}














