"use client";

import { useState, useEffect } from 'react';
import { DollarSign, Filter, Plus } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyConverter';

interface Transaction {
  id: string;
  transactionType: string;
  amount: number;
  currency: string;
  description: string | null;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
  branch: {
    id: string;
    name: string;
    slug: string;
  } | null;
  cleaner: {
    id: string;
    name: string;
  } | null;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    branchId: '',
    transactionType: '',
  });

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.branchId) params.append('branchId', filter.branchId);
      if (filter.transactionType) params.append('transactionType', filter.transactionType);

      const response = await fetch(`/api/admin/finance/transactions?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setTransactions(result.transactions || []);
      } else {
        setError(result.error || 'Failed to fetch transactions');
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      PAYMENT_RECEIVED: 'bg-vm-success-bg text-green-800',
      PAYOUT_PAID: 'bg-vm-danger-bg text-red-800',
      BONUS_ISSUED: 'bg-vm-warning-bg text-yellow-800',
      REFUND: 'bg-orange-100 text-orange-800',
      CASH_RECEIPT: 'bg-vm-cyan-tint text-blue-800',
      BANK_TRANSFER: 'bg-purple-100 text-purple-800',
      SUPPLIES: 'bg-gray-100 text-vm-text',
      OPERATIONAL_EXPENSE: 'bg-gray-100 text-vm-text',
    };
    return colorMap[type] || 'bg-gray-100 text-vm-text';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-vm-muted">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-vm-text mb-2">Transaction Ledger</h1>
          <p className="text-vm-muted">All financial transactions across branches</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-vm-muted" />
            <select
              value={filter.transactionType}
              onChange={(e) => setFilter({ ...filter, transactionType: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="PAYMENT_RECEIVED">Payment Received</option>
              <option value="PAYOUT_PAID">Payout Paid</option>
              <option value="BONUS_ISSUED">Bonus Issued</option>
              <option value="REFUND">Refund</option>
              <option value="CASH_RECEIPT">Cash Receipt</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="SUPPLIES">Supplies</option>
              <option value="OPERATIONAL_EXPENSE">Operational Expense</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-vm-text">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-vm-text">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-vm-text">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-vm-text">Branch</th>
                  <th className="text-left py-3 px-4 font-semibold text-vm-text">Cleaner</th>
                  <th className="text-right py-3 px-4 font-semibold text-vm-text">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-vm-muted">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-vm-muted">
                        {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getTransactionTypeColor(
                            transaction.transactionType
                          )}`}
                        >
                          {transaction.transactionType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-vm-text">
                        {transaction.description || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-vm-muted">
                        {transaction.branch?.name || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-vm-muted">
                        {transaction.cleaner?.name || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-semibold ${
                            transaction.transactionType === 'PAYMENT_RECEIVED' ||
                            transaction.transactionType === 'CASH_RECEIPT'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {transaction.transactionType === 'PAYMENT_RECEIVED' ||
                          transaction.transactionType === 'CASH_RECEIPT'
                            ? '+'
                            : '-'}
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

