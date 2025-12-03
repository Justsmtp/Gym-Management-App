// frontend/src/components/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import API from '../../api/api';
import AdminSidebar from './AdminSidebar';
import AdminSettingsPanel from './AdminSettingsPanel';
import AttendanceManagement from './AttendanceManagement';

const AdminDashboard = () => {
  useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    totalRevenue: 0,
    todayCheckIns: 0,
    weekCheckIns: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchAllData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Fetching admin dashboard data...');

      // Fetch all data in parallel
      const [usersRes, paymentsRes, attendanceRes, attendanceStatsRes, paymentsStatsRes] = await Promise.all([
        API.get('/users').catch(() => ({ data: [] })),
        API.get('/payments').catch(() => ({ data: [] })),
        API.get('/attendance/today').catch(() => ({ data: [] })),
        API.get('/attendance/stats').catch(() => ({ data: {} })),
        API.get('/payments/stats').catch(() => ({ data: {} })),
      ]);

      const fetchedUsers = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.users || [];
      const fetchedPayments = Array.isArray(paymentsRes.data) ? paymentsRes.data : paymentsRes.data.payments || [];
      const fetchedAttendance = Array.isArray(attendanceRes.data) ? attendanceRes.data : attendanceRes.data.attendance || [];

      setUsers(fetchedUsers);
      setPayments(fetchedPayments);
      setAttendance(fetchedAttendance);

      // Calculate stats from API and fallback to local calculations
      const calculatedStats = {
        totalUsers: fetchedUsers.length,
        activeUsers: fetchedUsers.filter(u => u.status === 'active').length,
        pendingUsers: fetchedUsers.filter(u => u.status === 'pending').length,
        totalRevenue: paymentsStatsRes.data.totalRevenue || fetchedPayments
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        todayCheckIns: attendanceStatsRes.data.stats?.todayCheckIns || fetchedAttendance.length,
        weekCheckIns: attendanceStatsRes.data.stats?.weekCheckIns || 0,
      };

      setStats(calculatedStats);
      setLastRefresh(new Date());

      console.log('✅ Admin data loaded:', {
        users: fetchedUsers.length,
        payments: fetchedPayments.length,
        attendance: fetchedAttendance.length,
      });

    } catch (err) {
      console.error('❌ Error fetching admin data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content - with left margin to account for fixed sidebar */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-black text-white p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="bg-gray-800 text-white px-4 py-2 rounded-full font-semibold hover:bg-gray-700 transition flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b-2 border-red-200 p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <p className="text-red-700 font-semibold">⚠️ {error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6">
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} users={users} payments={payments} attendance={attendance} />
          )}
          {activeTab === 'users' && (
            <UsersTab users={users} refreshData={fetchAllData} />
          )}
          {activeTab === 'payments' && (
            <PaymentsTab payments={payments} />
          )}
          {activeTab === 'attendance' && <AttendanceManagement />}
          {activeTab === 'settings' && (
            <AdminSettingsPanel />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab
const OverviewTab = ({ stats, users, payments, attendance }) => {
  const recentUsers = users.slice(0, 5);
  const recentPayments = payments
    .filter(p => p.status === 'completed')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle={`${stats.activeUsers} active`}
          icon={<Users size={24} />}
          color="blue"
        />
        <StatCard
          title="Active Members"
          value={stats.activeUsers}
          subtitle={`${stats.pendingUsers} pending`}
          icon={<CheckCircle size={24} />}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={`₦${stats.totalRevenue.toLocaleString()}`}
          subtitle="All time"
          icon={<TrendingUp size={24} />}
          color="purple"
        />
        <StatCard
          title="Today's Check-ins"
          value={stats.todayCheckIns}
          subtitle={`${stats.weekCheckIns} this week`}
          icon={<Clock size={24} />}
          color="orange"
        />
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold mb-4">Recent Registrations</h3>
          {recentUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users yet</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-black">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' :
                    user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold mb-4">Recent Payments</h3>
          {recentPayments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No payments yet</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-black">₦{payment.amount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">{payment.membershipType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-green-600 font-semibold">
                      {payment.paymentMethod}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Users Tab
const UsersTab = ({ users, refreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-black"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:border-black"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Membership</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Registered</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Verified</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">{user.name}</td>
                    <td className="py-3 px-4 text-sm">{user.email}</td>
                    <td className="py-3 px-4 text-sm">{user.phone}</td>
                    <td className="py-3 px-4">{user.membershipType}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        user.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {user.isVerified ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-600">✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> total users
        </p>
      </div>
    </div>
  );
};

// Payments Tab
const PaymentsTab = ({ payments }) => {
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredPayments = payments.filter((payment) => {
    const matchesMethod = filterMethod === 'all' || payment.paymentMethod === filterMethod;
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    return matchesMethod && matchesStatus;
  });

  const totalRevenue = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Filters and Summary */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h3 className="font-bold text-2xl">₦{totalRevenue.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">{filteredPayments.length} transactions</p>
          </div>
          <div className="flex gap-3">
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-black"
            >
              <option value="all">All Methods</option>
              <option value="Paystack">Paystack</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-black"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Membership</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Duration</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Method</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Trainer</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold">₦{payment.amount?.toLocaleString()}</td>
                    <td className="py-3 px-4">{payment.membershipType}</td>
                    <td className="py-3 px-4 text-sm">{payment.duration} days</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {payment.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {payment.trainerAddon ? '✅' : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold text-black mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
};

export default AdminDashboard;