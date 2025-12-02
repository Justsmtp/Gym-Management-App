import React from 'react';
import { Users, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const DashboardOverview = () => {
  const { users } = useApp();

  const totalMembers = users.length;
  const activePayments = users.filter(u => u.paymentStatus === 'active').length;
  const duePayments = users.filter(u => u.paymentStatus === 'due').length;
  const todayCheckIns = users.filter(u => u.checkInTime).length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Members</p>
              <p className="text-3xl font-bold text-black">{totalMembers}</p>
            </div>
            <Users size={32} className="text-gray-400" />
          </div>
          <p className="text-xs text-green-600">↑ Active users</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Payments</p>
              <p className="text-3xl font-bold text-green-600">{activePayments}</p>
            </div>
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <p className="text-xs text-gray-600">Paid memberships</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Due Payments</p>
              <p className="text-3xl font-bold text-red-600">{duePayments}</p>
            </div>
            <XCircle size={32} className="text-red-400" />
          </div>
          <p className="text-xs text-red-600">Requires attention</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Check-ins</p>
              <p className="text-3xl font-bold text-black">{todayCheckIns}</p>
            </div>
            <Clock size={32} className="text-gray-400" />
          </div>
          <p className="text-xs text-gray-600">Active sessions</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="p-6 border-b-2 border-gray-200">
          <h3 className="text-xl font-bold text-black">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {users.slice(0, 5).map(user => (
              <div key={user.id} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-black">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${user.paymentStatus === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {user.paymentStatus === 'active' ? '✓ Active' : '✗ Due'}
                  </p>
                  <p className="text-xs text-gray-600">{user.lastCheckIn}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardOverview;