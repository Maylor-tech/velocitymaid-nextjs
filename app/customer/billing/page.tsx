'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';
import { CreditCard, Mail, Lock, ExternalLink, FileText } from 'lucide-react';

interface PaymentMethodSummary {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface Invoice {
  id: string;
  amountPaid: number;
  amountDue: number;
  status: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  created: string;
  periodStart: string | null;
  periodEnd: string | null;
  description: string;
}

export default function CustomerBillingPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      // Fetch customer info
      const customerResponse = await fetch('/api/customer/me');
      if (!customerResponse.ok) {
        if (customerResponse.status === 401) {
          router.push('/customer/login');
          return;
        }
        throw new Error('Failed to fetch customer info');
      }
      const customerData = await customerResponse.json();
      if (customerData.success) {
        setCustomer(customerData.customer);
      }

      // Fetch billing summary
      const billingResponse = await fetch('/api/customer/billing/summary');
      const billingData = await billingResponse.json();
      if (billingData.success) {
        setPaymentMethod(billingData.paymentMethodSummary);
        setInvoices(billingData.recentInvoices || []);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    try {
      setOpeningPortal(true);
      const response = await fetch('/api/customer/billing/portal', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Failed to open billing portal');
    } finally {
      setOpeningPortal(false);
    }
  };

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing</h1>
        <p className="text-gray-600">Manage your payment information and invoices</p>
      </div>

      {/* Billing Summary */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Billing Summary</h2>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600 mb-1">Email on File</p>
              <p className="font-medium text-gray-900">{customer?.email || 'N/A'}</p>
            </div>
          </div>

          {paymentMethod ? (
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Primary Payment Method</p>
                <p className="font-medium text-gray-900">
                  {formatCardBrand(paymentMethod.brand)} •••• {paymentMethod.last4}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Primary Payment Method</p>
                <p className="text-sm text-gray-500">No payment method on file</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleOpenBillingPortal}
            disabled={openingPortal}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {openingPortal ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Opening...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Manage Payment Methods & Billing
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Invoices</h2>
        
        {invoices.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No invoices found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(invoice.created)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {invoice.description}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${invoice.amountPaid.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {invoice.hostedInvoiceUrl && (
                        <a
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          View Invoice
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Secure Payment Processing</p>
            <p className="text-xs text-blue-800">
              All payments are processed securely through Stripe. Your payment information is encrypted 
              and never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

