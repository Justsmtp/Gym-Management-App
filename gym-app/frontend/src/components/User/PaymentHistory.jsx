// frontend/src/components/User/PaymentHistory.jsx
import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import API from '../../api/api';

const PaymentHistory = () => {
  const { setCurrentScreen } = useApp();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching payment history...');
      
      const response = await API.get('/payments/history');
      
      console.log('✅ Payment history loaded:', response.data);
      setPayments(response.data.payments || []);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to fetch payment history:', err);
      setError(err.response?.data?.message || 'Failed to load payment history');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatAmount = (amount) => {
    return `₦${Number(amount).toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => setCurrentScreen('userDashboard')} 
            className="text-white hover:text-gray-300 transition"
          >
            ← Back
          </button>
          <span className="font-bold">Payment History</span>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader className="w-12 h-12 animate-spin text-black mb-4" />
              <p className="text-gray-600">Loading payment history...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-red-200 p-6">
            <div className="text-center">
              <div className="text-red-500 mb-4">⚠️</div>
              <p className="text-red-700 font-semibold mb-2">Error Loading Payment History</p>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchPaymentHistory}
                className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && payments.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-xl font-bold text-black mb-2">No Payment History</h3>
              <p className="text-gray-600 mb-6">You haven't made any payments yet.</p>
              <button
                onClick={() => setCurrentScreen('payment')}
                className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition"
              >
                Make a Payment
              </button>
            </div>
          </div>
        )}

        {/* Payments List */}
        {!loading && !error && payments.length > 0 && (
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Total Payments</h3>
              <p className="text-4xl font-bold">
                {formatAmount(
                  payments
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + (p.amount || 0), 0)
                )}
              </p>
              <p className="text-sm opacity-90 mt-2">
                {payments.filter(p => p.status === 'completed').length} completed transactions
              </p>
            </div>

            {/* Payment Cards */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
              <div className="divide-y-2 divide-gray-200">
                {payments.map((payment, index) => (
                  <div key={payment._id || index} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-black text-lg">
                          {formatDate(payment.createdAt || payment.completedAt)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {payment.membershipType} Membership
                        </p>
                        {payment.trainerAddon && (
                          <p className="text-xs text-purple-600 font-semibold mt-1">
                            ✓ Personal Trainer Included
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-black text-xl">
                          {formatAmount(payment.amount)}
                        </p>
                        <p className={`text-xs font-semibold mt-1 ${getStatusColor(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </p>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className="text-sm font-semibold text-black">
                          {payment.duration || 30} days
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Method</p>
                        <p className="text-sm font-semibold text-black">
                          {payment.paymentMethod || 'N/A'}
                        </p>
                      </div>
                      {payment.transactionId && (
                        <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                          <p className="text-xs font-mono text-black truncate">
                            {payment.transactionId}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Refresh Button */}
            <div className="text-center">
              <button
                onClick={fetchPaymentHistory}
                className="text-sm text-gray-600 hover:text-black transition underline"
              >
                🔄 Refresh History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;