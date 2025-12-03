import React from 'react';
import { Home, Calendar, CreditCard, User, Settings, LogOut, QrCode } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const UserSidebar = ({ activeTab, setActiveTab }) => {
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
            <p className="text-xs text-gray-400">Member Portal</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'home' ? 'bg-white text-black' : 'hover:bg-gray-800'
            }`}
          >
            <Home size={20} />
            <span className="font-semibold">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('barcode')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'barcode' ? 'bg-white text-black' : 'hover:bg-gray-800'
            }`}
          >
            <QrCode size={20} />
            <span className="font-semibold">My Barcode</span>
          </button>

          <button
            onClick={() => setActiveTab('membership')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'membership' ? 'bg-white text-black' : 'hover:bg-gray-800'
            }`}
          >
            <CreditCard size={20} />
            <span className="font-semibold">Membership</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'history' ? 'bg-white text-black' : 'hover:bg-gray-800'
            }`}
          >
            <Calendar size={20} />
            <span className="font-semibold">Payment History</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'profile' ? 'bg-white text-black' : 'hover:bg-gray-800'
            }`}
          >
            <User size={20} />
            <span className="font-semibold">Profile</span>
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

export default UserSidebar;