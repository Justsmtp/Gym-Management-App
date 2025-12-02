import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Sidebar from './Sidebar';
import DashboardOverview from './DashboardOverview';
import UserManagement from './UserManagement';
import PaymentControl from './PaymentControl';
import AttendanceLogs from './AttendanceLogs';
import SettingsPanel from './SettingsPanel';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { showSidebar, setShowSidebar } = useApp();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1">
        <div className="bg-white border-b-2 border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden"
              >
                {showSidebar ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h2 className="text-2xl font-bold text-black">
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'payments' && 'Payment Control'}
                {activeTab === 'attendance' && 'Attendance Logs'}
                {activeTab === 'settings' && 'Settings'}
              </h2>
            </div>
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'payments' && <PaymentControl />}
          {activeTab === 'attendance' && <AttendanceLogs />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;