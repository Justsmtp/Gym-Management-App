/* eslint-disable no-unused-vars */
// frontend/src/components/User/BarcodeScreen.jsx
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const BarcodeScreen = () => {
  const { currentUser, setCurrentScreen, handleCheckIn } = useApp();
  const [scanning, setScanning] = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);
  const [manualBarcode, setManualBarcode] = useState('');

  // Auto check-in with user's barcode when showing their QR code
  const handleAutoCheckIn = async () => {
    if (!currentUser?.barcode) {
      console.error('❌ No barcode found for current user');
      return;
    }

    setScanning(true);
    setCheckInResult(null);

    console.log('🔍 Auto check-in with barcode:', currentUser.barcode);

    const result = await handleCheckIn(currentUser.barcode);

    setScanning(false);
    setCheckInResult(result);

    // Auto-dismiss success message after 3 seconds
    if (result.success) {
      setTimeout(() => {
        setCheckInResult(null);
      }, 3000);
    }
  };

  // Manual barcode entry check-in
  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    
    if (!manualBarcode.trim()) {
      setCheckInResult({ success: false, message: 'Please enter a barcode' });
      return;
    }

    setScanning(true);
    setCheckInResult(null);

    console.log('🔍 Manual check-in with barcode:', manualBarcode);

    const result = await handleCheckIn(manualBarcode.trim());

    setScanning(false);
    setCheckInResult(result);
    
    if (result.success) {
      setManualBarcode('');
      setTimeout(() => {
        setCheckInResult(null);
      }, 3000);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <XCircle size={60} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">User information not found</p>
          <button
            onClick={() => setCurrentScreen('login')}
            className="bg-black text-white px-6 py-2 rounded-full"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser.barcode) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <XCircle size={60} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No barcode assigned to your account</p>
          <p className="text-sm text-gray-500 mb-4">Please contact gym staff</p>
          <button
            onClick={() => setCurrentScreen('userDashboard')}
            className="bg-black text-white px-6 py-2 rounded-full"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={() => setCurrentScreen('userDashboard')}
            className="text-white hover:text-gray-300"
          >
            ← Back
          </button>
          <span className="font-bold">Your Barcode</span>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {/* Check-in Result */}
        {checkInResult && (
          <div
            className={`mb-6 p-4 rounded-xl border-2 ${
              checkInResult.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {checkInResult.success ? (
                <CheckCircle size={24} className="text-green-600" />
              ) : (
                <XCircle size={24} className="text-red-600" />
              )}
              <div className="flex-1">
                <p
                  className={`font-semibold ${
                    checkInResult.success ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {checkInResult.success ? '✅ Check-in Successful!' : '❌ Check-in Failed'}
                </p>
                <p
                  className={`text-sm ${
                    checkInResult.success ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {checkInResult.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Display */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border-2 border-gray-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-black mb-2">
              {currentUser.name}
            </h2>
            <p className="text-gray-600 mb-6">Scan this code at the gym entrance</p>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-6 rounded-2xl shadow-xl border-4 border-black">
                <QRCodeSVG
                  value={currentUser.barcode}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            {/* Barcode Text */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-1">Barcode ID:</p>
              <p className="text-2xl font-mono font-bold text-black">
                {currentUser.barcode}
              </p>
            </div>

            {/* Membership Info */}
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Membership</p>
                <p className="font-semibold text-black">
                  {currentUser.membershipType}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Status</p>
                <p className="font-semibold text-black capitalize">
                  {currentUser.status}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total Visits</p>
                <p className="font-semibold text-black">
                  {currentUser.totalVisits || 0}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Last Check-in</p>
                <p className="font-semibold text-black text-xs">
                  {currentUser.lastCheckIn
                    ? new Date(currentUser.lastCheckIn).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Simulate Check-in Button */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-black mb-4">Simulate Check-in</h3>
          <p className="text-sm text-gray-600 mb-4">
            Use this to test the check-in system with your barcode
          </p>
          <button
            onClick={handleAutoCheckIn}
            disabled={scanning}
            className="w-full bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {scanning ? 'Checking in...' : '✓ Check In Now'}
          </button>
        </div>

        {/* Manual Barcode Entry (for admins/testing) */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-black mb-4">Manual Check-in</h3>
          <p className="text-sm text-gray-600 mb-4">
            Enter any barcode to test check-in system
          </p>
          <form onSubmit={handleManualCheckIn} className="space-y-4">
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Enter barcode (e.g., GYM-ABCD-1234)"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
            />
            <button
              type="submit"
              disabled={scanning}
              className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {scanning ? 'Checking in...' : 'Check In with Manual Barcode'}
            </button>
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📋 How to Use:</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Show this QR code at the gym entrance scanner</li>
            <li>Or use "Check In Now" to simulate scanning</li>
            <li>Your attendance will be recorded automatically</li>
            <li>Check your visit history on the dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScreen;