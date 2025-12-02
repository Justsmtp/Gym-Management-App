import React from 'react';
import { useApp } from '../../context/AppContext';

const PaymentHistory = () => {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-black text-white p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button onClick={() => setCurrentScreen('userDashboard')} className="text-white hover:text-gray-300">
            ← Back
          </button>
          <span className="font-bold">Payment History</span>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="border-b-2 border-gray-200 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-black">November 2025</p>
                  <p className="text-sm text-gray-600">Deluxe Membership</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-black">₦15,500</p>
                  <p className="text-xs text-green-600">Paid</p>
                </div>
              </div>
            </div>
            <div className="border-b-2 border-gray-200 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-black">October 2025</p>
                  <p className="text-sm text-gray-600">Deluxe Membership</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-black">₦15,500</p>
                  <p className="text-xs text-green-600">Paid</p>
                </div>
              </div>
            </div>
            <div className="pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-black">September 2025</p>
                  <p className="text-sm text-gray-600">Deluxe Membership</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-black">₦15,500</p>
                  <p className="text-xs text-green-600">Paid</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;