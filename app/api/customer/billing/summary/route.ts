export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findCustomerById } from '@/utils/customerData';
import { getOrCreateStripeCustomerForCustomer } from '@/utils/getOrCreateStripeCustomerForCustomer';
import { getStripe } from '@/utils/stripe';

/**
 * Get Billing Summary API
 * 
 * GET /api/customer/billing/summary
 * 
 * Returns payment method and recent invoices
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const customerId = cookieStore.get('customerId')?.value;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const customer = findCustomerById(customerId);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const stripeCustomerId = await getOrCreateStripeCustomerForCustomer(customer);
    const stripe = getStripe();

    let paymentMethodSummary = null;
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card',
        limit: 1,
      });

      if (paymentMethods.data.length > 0) {
        const pm = paymentMethods.data[0];
        paymentMethodSummary = {
          id: pm.id,
          brand: pm.card?.brand || 'unknown',
          last4: pm.card?.last4 || '****',
          expMonth: pm.card?.exp_month || 0,
          expYear: pm.card?.exp_year || 0,
        };
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      // Continue without payment method summary
    }

    // Fetch recent invoices
    let recentInvoices: Array<{
      id: string;
      amountPaid: number;
      amountDue: number;
      status: string | null;
      hostedInvoiceUrl: string | null;
      invoicePdf: string | null;
      created: string;
      periodStart: string | null;
      periodEnd: string | null;
      description: string;
    }> = [];
    try {
      const invoices = await stripe.invoices.list({
        customer: stripeCustomerId,
        limit: 5,
      });

      recentInvoices = invoices.data.map((invoice) => ({
        id: invoice.id,
        amountPaid: invoice.amount_paid / 100, // Convert from cents
        amountDue: invoice.amount_due / 100,
        status: invoice.status,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        created: new Date(invoice.created * 1000).toISOString(),
        periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
        description: invoice.description || invoice.lines.data[0]?.description || 'Invoice',
      }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      // Continue without invoices
    }

    return NextResponse.json({
      success: true,
      paymentMethodSummary,
      recentInvoices,
      stripeCustomerId,
    });
  } catch (error: unknown) {
    console.error('Billing summary error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch billing summary' },
      { status: 500 }
    );
  }
}

