import React from 'react';
import { BarChart3, Users, DollarSign, Clock, Settings, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { showSidebar, setUserType, setCurrentScreen } = useApp();

  const handleSignOut = () => {
    setUserType(null);
    setCurrentScreen('splash');
  };

  return (
    <div
      className={`${
        showSidebar ? 'w-64' : 'w-0'
      } bg-black text-white transition-all duration-300 overflow-hidden`}
    >
      <div className="p-6">
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-8">
          <img
            src="/logo.png"
            alt="1st Impression"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold">1st Impression</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'dashboard' ? 'bg-white text-black' : 'hover:bg-gray-800'
            }`}
          >
            <BarChart3 size={20} />
            <span className="font-semibold">Dashboard</span>
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

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition mt-8"
        >
          <LogOut size={20} />
          <span className="font-semibold">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
