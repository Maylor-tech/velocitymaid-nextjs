export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

/**
 * Transaction Ledger API
 * GET /api/admin/finance/transactions
 * POST /api/admin/finance/transactions
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { Prisma } from '@prisma/client';
import { randomUUID } from "crypto";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId');
    const transactionType = searchParams.get('transactionType');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: Prisma.TransactionLedgerWhereInput = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (transactionType) {
      where.transactionType = transactionType;
    }

    const transactions = await prisma.transactionLedger.findMany({
      where,
      include: {
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const body = await request.json();
    const {
      branchId,
      transactionType,
      amount,
      currency,
      description,
      referenceId,
      referenceType,
      cleanerId,
      customerId,
      metadata,
    } = body;

    if (!transactionType || !amount) {
      return NextResponse.json(
        { success: false, error: 'Transaction type and amount are required' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transactionLedger.create({
      data: {
        id: randomUUID(),
        branchId: branchId || null,
        transactionType,
        amount: Number(amount),
        currency: currency || 'JMD',
        description: description || null,
        referenceId: referenceId || null,
        referenceType: referenceType || null,
        cleanerId: cleanerId || null,
        customerId: customerId || null,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : null,
        updatedAt: new Date(),
      },
      include: {
        Branch: {
          select: {
            id: true,
            name: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

