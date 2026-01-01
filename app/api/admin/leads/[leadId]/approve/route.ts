/**
 * Approve Lead (Convert to Customer)
 * POST /api/admin/leads/[leadId]/approve
 */

export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const body = await request.json();
    const { branchId } = body;

    const lead = await prisma.lead.findUnique({
      where: { id: params.leadId },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Create or find customer
    let customer = await prisma.customer.findFirst({
      where: {
        phone: lead.phone,
        branchId: lead.branchId,
      },
    });

    if (!customer) {
      const nameParts = lead.name.split(' ');
      customer = await prisma.customer.create({
        data: {
          firstName: nameParts[0] || lead.name,
          lastName: nameParts.slice(1).join(' ') || '',
          email: lead.email || `${lead.phone}@temp.velocitymaid.com`,
          phone: lead.phone,
          branchId: lead.branchId,
          homeZipCode: lead.zip || undefined,
          leadStatus: 'ACTIVE',
          whatsappOptIn: true,
        },
      });
    }

    // Update lead
    await prisma.lead.update({
      where: { id: params.leadId },
      data: {
        status: 'QUALIFIED',
        customerId: customer.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Lead approved and converted to customer',
      customerId: customer.id,
    });
  } catch (error: any) {
    console.error('Approve lead error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to approve lead' },
      { status: 500 }
    );
  }
}


