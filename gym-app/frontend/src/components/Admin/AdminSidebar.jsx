import React from 'react';
import { BarChart3, Users, DollarSign, Clock, Settings, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const { handleSignOut } = useApp();

  return (
    <div className="w-64 bg-black text-white h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 flex-1">
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-xl">1st</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">1st Impression</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'overview' ? 'bg-white text-black' : 'hover:bg-gray-800'
            }`}
          >
            <BarChart3 size={20} />
            <span className="font-semibold">Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'users' ? 'bg-white text-black' : 'hover:bg-gray-800'
            }`}
          >
            <Users size={20} />
            <span className="font-semibold">Users</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'payments' ? 'bg-white text-black' : 'hover:bg-gray-800'
            }`}
          >
            <DollarSign size={20} />
            <span className="font-semibold">Payments</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'attendance' ? 'bg-white text-black' : 'hover:bg-gray-800'
            }`}
          >
            <Clock size={20} />
            <span className="font-semibold">Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'settings' ? 'bg-white text-black' : 'hover:bg-gray-800'
            }`}
          >
            <Settings size={20} />
            <span className="font-semibold">Settings</span>
          </button>
        </nav>
      </div>

      {/* Sign Out Button */}
      <div className="p-6 border-t border-gray-800">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition"
        >
          <LogOut size={20} />
          <span className="font-semibold">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
