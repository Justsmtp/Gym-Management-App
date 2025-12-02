import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const BarcodeScreen = () => {
  const [scanned, setScanned] = useState(false);
  const { currentUser, handleCheckIn, setCurrentScreen } = useApp();

  const onScan = () => {
    handleCheckIn();
    setScanned(true);
    setTimeout(() => setScanned(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-black text-white p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button onClick={() => setCurrentScreen('userDashboard')} className="text-white hover:text-gray-300">
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <Dumbbell size={32} />
            <span className="font-bold">ST Impression</span>
          </div>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-6 text-center">
        <h2 className="text-3xl font-bold text-black mb-8">Your Access Code</h2>

        <div className="bg-white border-4 border-black rounded-2xl p-8 mb-6 shadow-2xl">
          <p className="text-sm text-gray-600 mb-4">Member ID</p>
          <div className="text-7xl font-bold text-black mb-6 tracking-wider">{currentUser?.barcode}</div>
          
          <div className="w-64 h-64 bg-gray-100 border-2 border-gray-300 rounded-xl mx-auto flex items-center justify-center mb-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-2">SCAN AT ENTRANCE</div>
              <div className="w-48 h-48 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                <div className="grid grid-cols-8 gap-1">
                  {[...Array(64)].map((_, i) => (
                    <div key={i} className={`w-3 h-3 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">Present this code at the gym entrance</p>
        </div>

        {scanned && (
          <div className="bg-green-500 text-white py-3 px-6 rounded-full font-semibold mb-4 animate-pulse">
            ✓ {currentUser.checkOutTime ? 'Session Ended' : 'Active Session'}
          </div>
        )}

        <button
          onClick={onScan}
          className="w-full bg-black text-white py-4 px-6 rounded-full font-semibold hover:bg-gray-800 transition shadow-lg"
        >
          Simulate Scan
        </button>

        <div className="mt-6 text-left bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
          <h3 className="font-bold text-black mb-2">Today's Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-semibold">{currentUser?.checkInTime || 'Not checked in'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-out:</span>
              <span className="font-semibold">{currentUser?.checkOutTime || 'Still in gym'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScreen;