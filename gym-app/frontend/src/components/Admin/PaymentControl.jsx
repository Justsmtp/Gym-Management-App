/* eslint-disable no-unused-vars */
// frontend/src/components/Admin/PaymentControl.jsx
import React, { useState, useEffect } from 'react';
import { User, DollarSign, RefreshCw, TrendingUp } from 'lucide-react';
import API from '../../api/api';

const PaymentControl = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching users for payment control...');
      const response = await API.get('/users');
      const fetchedUsers = response.data.users || response.data || [];
      setUsers(fetchedUsers);
      setLastRefresh(new Date());
      console.log('✅ Users loaded:', fetchedUsers.length);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchUsers, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update payment status
  const handleUpdatePaymentStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'pending' : 'active';
      console.log(`💳 Updating payment status for user ${userId} to: ${newStatus}`);
      
      await API.put(`/users/${userId}/payment-status`, { paymentStatus: newStatus });
      await fetchUsers(); // Refresh list
      
      console.log('✅ Payment status updated successfully');
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  // Filter users based on membership/payment status
  const filteredUsers = users.filter((user) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return user.status === 'active' && user.paymentStatus === 'active';
    if (filterStatus === 'pending') return user.status === 'pending' || user.paymentStatus === 'pending';
    if (filterStatus === 'overdue') return user.paymentStatus === 'overdue' || user.status === 'expired';
    return true;
  });

  // Calculate statistics
  const stats = {
    totalRevenue: users.reduce((sum, user) => sum + (user.membershipPrice || 0), 0),
    activePayments: users.filter(u => u.paymentStatus === 'active').length,
    pendingPayments: users.filter(u => u.paymentStatus === 'pending' || u.status === 'pending').length,
    overduePayments: users.filter(u => u.paymentStatus === 'overdue' || u.status === 'expired').length,
  };

  if (loading && users.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading payment data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-black">₦{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Payments</p>
              <p className="text-2xl font-bold text-green-600">{stats.activePayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overduePayments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterStatus === 'all' 
                ? 'bg-black text-white' 
                : 'bg-white text-black border-2 border-gray-200 hover:border-black'
            }`}
          >
            All Members ({users.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterStatus === 'active' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-black border-2 border-gray-200 hover:border-green-600'
            }`}
          >
            Active ({stats.activePayments})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterStatus === 'pending' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-white text-black border-2 border-gray-200 hover:border-yellow-600'
            }`}
          >
            Pending ({stats.pendingPayments})
          </button>
          <button
            onClick={() => setFilterStatus('overdue')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterStatus === 'overdue' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-black border-2 border-gray-200 hover:border-red-600'
            }`}
          >
            Overdue ({stats.overduePayments})
          </button>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="ml-auto px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Payment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center border-2 border-gray-200">
            <p className="text-gray-500">No members found</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div 
              key={user._id} 
              className={`bg-white rounded-2xl shadow-lg p-6 border-2 transition hover:shadow-xl ${
                user.status === 'active' && user.paymentStatus === 'active' 
                  ? 'border-green-200' 
                  : user.status === 'pending' || user.paymentStatus === 'pending'
                  ? 'border-yellow-200'
                  : 'border-red-200'
              }`}
            >
              {/* User Header */}
              <div className="flex items-center gap-3 mb-4">
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-200">
                    <span className="text-white text-lg font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-black">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  user.status === 'active' && user.paymentStatus === 'active'
                    ? 'bg-green-100 text-green-800'
                    : user.status === 'pending' || user.paymentStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.status}
                </span>
              </div>

              {/* Membership Details */}
              <div className="space-y-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Current Plan</p>
                  <p className="font-bold text-black">{user.membershipType}</p>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="font-bold text-black text-lg">₦{user.membershipPrice?.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Status:</span>
                  <span className={`font-bold ${
                    user.paymentStatus === 'active' ? 'text-green-600' : 
                    user.paymentStatus === 'pending' ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {user.paymentStatus === 'active' ? 'Paid' : 
                     user.paymentStatus === 'pending' ? 'Pending' : 
                     'Overdue'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Expiry Date:</span>
                  <span className="font-semibold text-black">
                    {user.membershipEndDate 
                      ? new Date(user.membershipEndDate).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Visits:</span>
                  <span className="font-bold text-black">{user.totalVisits || 0}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleUpdatePaymentStatus(user._id, user.paymentStatus)}
                disabled={loading}
                className={`w-full py-2 px-4 rounded-lg font-semibold transition disabled:opacity-50 ${
                  user.paymentStatus === 'active'
                    ? 'bg-gray-200 text-black hover:bg-gray-300'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {user.paymentStatus === 'active' ? 'Mark as Due' : 'Mark as Paid'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} members • Last updated: {lastRefresh.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default PaymentControl;