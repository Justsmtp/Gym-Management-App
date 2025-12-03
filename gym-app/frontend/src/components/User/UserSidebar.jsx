import React from 'react';
import { Home, Calendar, CreditCard, User, Settings, LogOut, QrCode } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const UserSidebar = ({ activeTab, setActiveTab }) => {
  const { handleSignOut } = useApp();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'barcode', label: 'My Barcode', icon: QrCode },
    { id: 'membership', label: 'Membership', icon: CreditCard },
    { id: 'history', label: 'Payment History', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-black text-white h-screen flex flex-col overflow-y-auto">
      <div className="p-4 md:p-6 flex-1">
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-black font-bold text-lg md:text-xl">1st</span>
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold">1st Impression</h1>
            <p className="text-xs text-gray-400">Member Portal</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 md:space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition ${
                  activeTab === item.id ? 'bg-white text-black' : 'hover:bg-gray-800'
                }`}
              >
                <Icon size={18} className="md:w-5 md:h-5 flex-shrink-0" />
                <span className="font-semibold text-sm md:text-base">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sign Out Button */}
      <div className="p-4 md:p-6 border-t border-gray-800">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg hover:bg-gray-800 transition"
        >
          <LogOut size={18} className="md:w-5 md:h-5 flex-shrink-0" />
          <span className="font-semibold text-sm md:text-base">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default UserSidebar;
