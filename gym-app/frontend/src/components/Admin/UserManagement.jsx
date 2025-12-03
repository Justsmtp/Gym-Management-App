// frontend/src/components/Admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { User, RefreshCw, Search } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await response.json();
      console.log('Users fetched:', data);
      setUsers(data.users || data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update user status
  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update user status');
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    expired: users.filter(u => u.status === 'expired').length,
  };

  if (loading && users.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-xl shadow-lg p-4 border-2 transition ${
            statusFilter === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
        >
          <p className="text-xs font-semibold text-gray-600">TOTAL</p>
          <p className="text-2xl font-bold text-black">{stats.total}</p>
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`bg-white rounded-xl shadow-lg p-4 border-2 transition ${
            statusFilter === 'active' ? 'border-green-500 bg-green-50' : 'border-gray-200'
          }`}
        >
          <p className="text-xs font-semibold text-gray-600">ACTIVE</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`bg-white rounded-xl shadow-lg p-4 border-2 transition ${
            statusFilter === 'pending' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
          }`}
        >
          <p className="text-xs font-semibold text-gray-600">PENDING</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </button>
        <button
          onClick={() => setStatusFilter('expired')}
          className={`bg-white rounded-xl shadow-lg p-4 border-2 transition ${
            statusFilter === 'expired' ? 'border-red-500 bg-red-50' : 'border-gray-200'
          }`}
        >
          <p className="text-xs font-semibold text-gray-600">EXPIRED</p>
          <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="p-6 border-b-2 border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-xl font-bold text-black">All Members ({filteredUsers.length})</h3>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black"
                />
              </div>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Visits</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {user.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-black">{user.name}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-black">{user.membershipType}</p>
                    <p className="text-xs text-gray-600">₦{user.membershipPrice?.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      user.status === 'expired' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-black">{user.totalVisits || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.status}
                      onChange={(e) => handleUpdateStatus(user._id, e.target.value)}
                      className="text-sm border-2 border-gray-200 rounded-lg px-3 py-1 font-semibold focus:outline-none focus:border-black"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="expired">Expired</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;