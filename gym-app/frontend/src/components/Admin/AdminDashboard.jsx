/* eslint-disable no-unused-vars */
// frontend/src/components/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, TrendingUp, RefreshCw, Menu, X, Eye, Mail, Phone, Calendar, CreditCard, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import api from '../../api/api';
import AdminSidebar from './AdminSidebar';
import AdminSettingsPanel from './AdminSettingsPanel';
import AttendanceManagement from './AttendanceManagement';

const AdminDashboard = () => {
  useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
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
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersRes, paymentsRes, attendanceRes, attendanceStatsRes, paymentsStatsRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/payments').catch(() => ({ data: [] })),
        api.get('/attendance/today').catch(() => ({ data: [] })),
        api.get('/attendance/stats').catch(() => ({ data: {} })),
        api.get('/payments/stats').catch(() => ({ data: {} })),
      ]);

      const fetchedUsers = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.users || [];
      const fetchedPayments = Array.isArray(paymentsRes.data) ? paymentsRes.data : paymentsRes.data.payments || [];
      const fetchedAttendance = Array.isArray(attendanceRes.data) ? attendanceRes.data : attendanceRes.data.attendance || [];

      setUsers(fetchedUsers);
      setPayments(fetchedPayments);
      setAttendance(fetchedAttendance);

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

    } catch (err) {
      console.error('❌ Error fetching admin data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-t-4 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-sm md:text-base text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 bottom-0 w-64 z-40
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AdminSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 w-full lg:ml-64">
        {/* Header */}
        <header className="bg-black text-white p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition"
                aria-label="Toggle menu"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-bold">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </p>
              </div>

              <button
                onClick={fetchAllData}
                disabled={loading}
                className="bg-gray-800 text-white px-3 md:px-4 py-2 rounded-full font-semibold hover:bg-gray-700 transition flex items-center space-x-2 disabled:opacity-50 text-sm md:text-base"
              >
                <RefreshCw size={14} className={`md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b-2 border-red-200 p-3 md:p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <p className="text-xs md:text-sm text-red-700 font-semibold">⚠️ {error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 text-lg"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} users={users} payments={payments} onViewUser={handleViewUser} />
          )}
          {activeTab === 'users' && (
            <UsersTab users={users} refreshData={fetchAllData} onViewUser={handleViewUser} />
          )}
          {activeTab === 'payments' && (
            <PaymentsTab payments={payments} onViewUser={handleViewUser} />
          )}
          {activeTab === 'attendance' && <AttendanceManagement />}
          {activeTab === 'settings' && <AdminSettingsPanel />}
        </div>
      </main>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <UserDetailModal 
          user={selectedUser} 
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

// User Detail Modal Component
const UserDetailModal = ({ user, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white"
                  onError={(e) => e.target.style.display = 'none'}
                />
              ) : (
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-3xl font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                <p className="text-white opacity-90">{user.membershipType} Member</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`px-6 py-2 rounded-full text-sm font-bold ${
              user.status === 'active' ? 'bg-green-100 text-green-800' :
              user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {user.status?.toUpperCase()}
            </span>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-lg text-black mb-3">Contact Information</h3>
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Email</p>
                <p className="font-semibold text-black">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Phone</p>
                <p className="font-semibold text-black">{user.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Membership Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-lg text-black mb-3">Membership Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Plan Type</p>
                <p className="font-semibold text-black">{user.membershipType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Price</p>
                <p className="font-semibold text-black">₦{user.membershipPrice?.toLocaleString() || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Start Date</p>
                <p className="font-semibold text-black">{formatDate(user.membershipStartDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Expiry Date</p>
                <p className="font-semibold text-black">{formatDate(user.membershipEndDate)}</p>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-bold text-lg text-black mb-3">Activity Stats</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-black">{user.totalVisits || 0}</p>
                <p className="text-xs text-gray-600">Total Visits</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{user.membershipDuration || 0}</p>
                <p className="text-xs text-gray-600">Duration (days)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-black">
                  {user.lastCheckIn ? formatDate(user.lastCheckIn) : 'Never'}
                </p>
                <p className="text-xs text-gray-600">Last Check-in</p>
              </div>
            </div>
          </div>

          {/* Barcode */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <h3 className="font-bold text-lg text-black mb-3">Member ID</h3>
            <p className="font-mono text-2xl font-bold text-black">{user.barcode || 'N/A'}</p>
          </div>

          {/* Registration Date */}
          <div className="text-center text-sm text-gray-600">
            Member since {formatDate(user.createdAt)}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats, users, payments, onViewUser }) => {
  const recentUsers = users.slice(0, 5);
  const recentPayments = payments
    .filter(p => p.status === 'completed')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle={`${stats.activeUsers} active`}
          icon={<Users size={20} className="md:w-6 md:h-6" />}
          color="blue"
        />
        <StatCard
          title="Active Members"
          value={stats.activeUsers}
          subtitle={`${stats.pendingUsers} pending`}
          icon={<CheckCircle size={20} className="md:w-6 md:h-6" />}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={`₦${stats.totalRevenue.toLocaleString()}`}
          subtitle="All time"
          icon={<TrendingUp size={20} className="md:w-6 md:h-6" />}
          color="purple"
        />
        <StatCard
          title="Today's Check-ins"
          value={stats.todayCheckIns}
          subtitle={`${stats.weekCheckIns} this week`}
          icon={<Clock size={20} className="md:w-6 md:h-6" />}
          color="orange"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
          <h3 className="text-base md:text-lg font-bold mb-4">Recent Registrations</h3>
          {recentUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">No users yet</p>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {recentUsers.map((user) => (
                <div 
                  key={user._id} 
                  className="flex items-center gap-3 p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => onViewUser(user)}
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-black text-sm md:text-base truncate">{user.name}</p>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  </div>
                  <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
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

        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
          <h3 className="text-base md:text-lg font-bold mb-4">Recent Payments</h3>
          {recentPayments.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">No payments yet</p>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {recentPayments.map((payment) => (
                <div 
                  key={payment._id} 
                  className="flex items-center gap-3 p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => payment.user && onViewUser(payment.user)}
                >
                  {payment.user?.profilePicture ? (
                    <img
                      src={payment.user.profilePicture}
                      alt={payment.user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">
                        {payment.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-black text-sm md:text-base">
                      {payment.user?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-600">
                      ₦{payment.amount?.toLocaleString()} • {payment.membershipType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 whitespace-nowrap">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                    <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                      {payment.status}
                    </span>
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
const UsersTab = ({ users, refreshData, onViewUser }) => {
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
      <div className="bg-white rounded-xl shadow p-3 md:p-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 md:px-4 py-2 border rounded-lg focus:outline-none focus:border-black text-sm md:text-base"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 md:px-4 py-2 border rounded-lg focus:outline-none focus:border-black text-sm md:text-base"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-bold">User</th>
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-bold">Email</th>
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-bold">Membership</th>
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-bold">Status</th>
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      <div className="flex items-center gap-2">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        ) : (
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs md:text-sm font-bold">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <p className="text-xs md:text-sm font-semibold">{user.name}</p>
                      </div>
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">{user.email}</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">{user.membershipType}</td>
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      <button
                        onClick={() => onViewUser(user)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs md:text-sm flex items-center gap-1"
                      >
                        <Eye size={16} />
                        View
                      </button>
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

// Payments Tab
const PaymentsTab = ({ payments, onViewUser }) => {
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = payments.filter((payment) => {
    const matchesMethod = filterMethod === 'all' || payment.paymentMethod === filterMethod;
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesSearch = !searchTerm || 
      payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.membershipType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesMethod && matchesStatus && matchesSearch;
  });

  const totalRevenue = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-4 md:p-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-lg md:text-xl font-semibold mb-1">Total Revenue</h3>
            <p className="text-3xl md:text-4xl font-bold">₦{totalRevenue.toLocaleString()}</p>
            <p className="text-sm opacity-90 mt-1">{filteredPayments.length} transactions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-semibold">
              {payments.filter(p => p.status === 'completed').length} Completed
            </span>
            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-semibold">
              {payments.filter(p => p.status === 'pending').length} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-3 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 md:px-4 py-2 border rounded-lg focus:outline-none focus:border-black text-sm md:text-base"
          />
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-3 md:px-4 py-2 border rounded-lg focus:outline-none focus:border-black text-sm md:text-base"
          >
            <option value="all">All Methods</option>
            <option value="Paystack">Paystack</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 md:px-4 py-2 border rounded-lg focus:outline-none focus:border-black text-sm md:text-base"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        {(searchTerm || filterMethod !== 'all' || filterStatus !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterMethod('all');
              setFilterStatus('all');
            }}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-semibold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[768px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-bold">User</th>
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-bold">Date</th>
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-bold">Amount</th>
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-bold">Membership</th>
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-bold">Method</th>
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="border-b hover:bg-gray-50">
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      <div className="flex items-center gap-2">
                        {payment.user?.profilePicture ? (
                          <img
                            src={payment.user.profilePicture}
                            alt={payment.user.name}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {payment.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-xs md:text-sm font-semibold text-black">
                            {payment.user?.name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.user?.email || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-bold">
                      ₦{payment.amount?.toLocaleString()}
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">
                      <div>
                        <p className="font-semibold">{payment.membershipType}</p>
                        {payment.trainerAddon && (
                          <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                            + Trainer
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {payment.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
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
// Stat Card
const StatCard = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <div className={`w-10 h-10 md:w-12 md:h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
      <h3 className="text-gray-600 text-xs md:text-sm mb-1">{title}</h3>
      <p className="text-2xl md:text-3xl font-bold text-black mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
};

export default AdminDashboard;
