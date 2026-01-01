export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'
/**
 * Jamaica P&L Dashboard API
 * GET /api/admin/finance/jamaica/pnl
 * POST /api/admin/finance/jamaica/pnl (update expenses)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';
import { getJamaicaRevenue } from '@/utils/jamaicaFinanceQueries';
import { convertUSDToJMD } from '@/utils/currencyConverter';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    // TODO: Add admin authentication check

    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Get revenue
    const revenue = await getJamaicaRevenue(startDate, endDate);

    // Get cleaner payouts
    const payouts = await prisma.jamaicaPayout.findMany({
      where: {
        branch: {
          slug: 'port-antonio',
        },
        periodStart: { gte: startDate },
        periodEnd: { lte: endDate },
        status: { in: ['APPROVED', 'PAID'] },
      },
      select: {
        totalAmount: true,
      },
    });

    const totalPayouts = payouts.reduce((sum, p) => sum + Number(p.totalAmount), 0);

    // Get bonuses (from transaction ledger or calculate)
    // For now, estimate from payouts or use transaction ledger
    const bonuses = await prisma.transactionLedger.findMany({
      where: {
        branch: {
          slug: 'port-antonio',
        },
        transactionType: 'BONUS_ISSUED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
      },
    });

    const totalBonuses = bonuses.reduce((sum, b) => sum + Number(b.amount), 0);

    // Get operational expenses (from transaction ledger)
    const expenses = await prisma.transactionLedger.findMany({
      where: {
        branch: {
          slug: 'port-antonio',
        },
        transactionType: { in: ['SUPPLIES', 'OPERATIONAL_EXPENSE'] },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        currency: true,
        description: true,
      },
    });

    const totalExpenses = expenses.reduce((sum, e) => {
      const amount = Number(e.amount);
      if (e.currency === 'USD') {
        return sum + convertUSDToJMD(amount);
      }
      return sum + amount;
    }, 0);

    // Calculate net margin
    const totalCosts = totalPayouts + totalBonuses + totalExpenses;
    const netMargin = revenue.totalRevenueCombined - totalCosts;
    const marginPercentage = revenue.totalRevenueCombined > 0
      ? (netMargin / revenue.totalRevenueCombined) * 100
      : 0;

    // Profit per job
    const profitPerJob = revenue.jobCount > 0 ? netMargin / revenue.jobCount : 0;

    // Get cleaner count
    const cleanerCount = await prisma.user.count({
      where: {
        role: 'CLEANER',
        primaryBranch: {
          slug: 'port-antonio',
        },
        trainingStatus: {
          overallStatus: 'PASSED',
        },
      },
    });

    const profitPerCleaner = cleanerCount > 0 ? netMargin / cleanerCount : 0;

    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          jmd: revenue.totalRevenueJMD,
          usd: revenue.totalRevenueUSD,
          combined: revenue.totalRevenueCombined,
        },
        costs: {
          payouts: totalPayouts,
          bonuses: totalBonuses,
          expenses: totalExpenses,
          total: totalCosts,
        },
        netMargin,
        marginPercentage,
        profitPerJob,
        profitPerCleaner,
        jobCount: revenue.jobCount,
        cleanerCount,
        expenses: expenses.map((e) => ({
          amount: Number(e.amount),
          currency: e.currency,
          description: e.description,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get P&L error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch P&L data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check

    const body = await request.json();
    const { amount, currency, description, transactionType = 'OPERATIONAL_EXPENSE' } = body;

    if (!amount || !description) {
      return NextResponse.json(
        { success: false, error: 'Amount and description are required' },
        { status: 400 }
      );
    }

    // Get Port Antonio branch
    const branch = await prisma.branch.findUnique({
      where: { slug: 'port-antonio' },
      select: { id: true },
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Port Antonio branch not found' },
        { status: 404 }
      );
    }

    // Create transaction ledger entry
    const transaction = await prisma.transactionLedger.create({
      data: {
        branchId: branch.id,
        transactionType,
        amount: Number(amount),
        currency: currency || 'JMD',
        description,
      },
    });

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error: any) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create expense' },
      { status: 500 }
    );
  }
}


