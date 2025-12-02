import React from 'react';
import { User, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const UserDashboard = () => {
  const { currentUser, handleSignOut, setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold">1st Impression</h1>
              <p className="text-sm text-gray-300">Fitness Center</p>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              <User size={40} className="text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">{currentUser?.name}</h2>
              <p className="text-gray-600">{currentUser?.membershipType} Member</p>
            </div>
          </div>

          {/* Membership Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Payment Status</p>
              <div className="flex items-center gap-2">
                {currentUser?.paymentStatus === 'active' ? (
                  <>
                    <CheckCircle size={24} className="text-green-500" />
                    <span className="text-lg font-bold text-green-600">Active</span>
                  </>
                ) : (
                  <>
                    <XCircle size={24} className="text-red-500" />
                    <span className="text-lg font-bold text-red-600">Due</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Next Due Date</p>
              <p className="text-lg font-bold text-black">{currentUser?.nextDueDate}</p>
            </div>
          </div>
        </div>

        {/* Check-in Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold text-black mb-4">Today's Check-in Status</h3>
          {currentUser?.checkInTime ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Check-in Time:</span>
                <span className="font-bold text-green-600">{currentUser.checkInTime}</span>
              </div>
              {currentUser?.checkOutTime && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Check-out Time:</span>
                  <span className="font-bold text-red-600">{currentUser.checkOutTime}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No check-in today</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setCurrentScreen('barcode')}
            className="bg-black text-white py-4 px-6 rounded-xl font-semibold hover:bg-gray-800 transition shadow-lg"
          >
            Show Barcode
          </button>
          <button
            onClick={() => setCurrentScreen('payment')}
            className="bg-white text-black border-2 border-black py-4 px-6 rounded-xl font-semibold hover:bg-gray-100 transition"
          >
            Renew Membership
          </button>
          <button
            onClick={() => setCurrentScreen('paymentHistory')}
            className="bg-white text-black border-2 border-black py-4 px-6 rounded-xl font-semibold hover:bg-gray-100 transition"
          >
            Payment History
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
