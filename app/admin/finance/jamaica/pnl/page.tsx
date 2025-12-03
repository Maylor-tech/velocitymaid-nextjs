'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Plus, Edit } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyConverter';

interface PnLData {
  revenue: {
    jmd: number;
    usd: number;
    combined: number;
  };
  costs: {
    payouts: number;
    bonuses: number;
    expenses: number;
    total: number;
  };
  netMargin: number;
  marginPercentage: number;
  profitPerJob: number;
  profitPerCleaner: number;
  jobCount: number;
  cleanerCount: number;
  expenses: Array<{
    amount: number;
    currency: string;
    description: string | null;
  }>;
}

export default function JamaicaPnLPage() {
  const [data, setData] = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    currency: 'JMD',
    description: '',
  });

  useEffect(() => {
    fetchPnL();
  }, []);

  const fetchPnL = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/finance/jamaica/pnl');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch P&L data');
      }
    } catch (err: any) {
      console.error('Error fetching P&L:', err);
      setError(err.message || 'Failed to load P&L data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/finance/jamaica/pnl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseForm),
      });

      const result = await response.json();

      if (result.success) {
        setShowAddExpense(false);
        setExpenseForm({ amount: '', currency: 'JMD', description: '' });
        await fetchPnL(); // Refresh data
      } else {
        alert(result.error || 'Failed to add expense');
      }
    } catch (err: any) {
      console.error('Error adding expense:', err);
      alert(err.message || 'Failed to add expense');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading P&L data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || 'Failed to load P&L data'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jamaica P&L Dashboard</h1>
          <p className="text-gray-600">Profit & Loss for Port Antonio Branch</p>
        </div>

        {/* Revenue Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">JMD Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.revenue.jmd, 'JMD')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">USD Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.revenue.usd, 'USD')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Combined Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(data.revenue.combined, 'JMD')}
              </p>
            </div>
          </div>
        </div>

        {/* Costs Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Costs</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Cleaner Payouts</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(data.costs.payouts, 'JMD')}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Bonuses</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(data.costs.bonuses, 'JMD')}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Operational Expenses</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(data.costs.expenses, 'JMD')}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <span className="font-semibold text-gray-900">Total Costs</span>
              <span className="text-xl font-bold text-red-600">
                {formatCurrency(data.costs.total, 'JMD')}
              </span>
            </div>
          </div>
        </div>

        {/* Net Margin */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Net Margin</h2>
            {data.netMargin >= 0 ? (
              <TrendingUp className="w-6 h-6 text-green-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-600" />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Net Profit/Loss</p>
              <p
                className={`text-3xl font-bold ${
                  data.netMargin >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(data.netMargin, 'JMD')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Margin Percentage</p>
              <p
                className={`text-3xl font-bold ${
                  data.marginPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {data.marginPercentage.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Profit per Job</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.profitPerJob, 'JMD')}
              </p>
            </div>
          </div>
        </div>

        {/* Expenses Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Operational Expenses</h2>
            <button
              onClick={() => setShowAddExpense(!showAddExpense)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>

          {showAddExpense && (
            <form onSubmit={handleAddExpense} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={expenseForm.currency}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, currency: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="JMD">JMD</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Expense
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExpense(false);
                    setExpenseForm({ amount: '', currency: 'JMD', description: '' });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {data.expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No expenses recorded</p>
            ) : (
              data.expenses.map((expense, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {expense.description || 'No description'}
                    </p>
                    <p className="text-sm text-gray-600">{expense.currency}</p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(expense.amount, expense.currency)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

