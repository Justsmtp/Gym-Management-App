// frontend/src/components/User/PaymentScreen.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { paystackConfig, membershipPlans } from '../../config/paystack';
import API from '../../api/api';

const PaymentScreen = () => {
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('paystack');
  const [selectedPlan, setSelectedPlan] = useState('deluxe');
  const [addTrainer, setAddTrainer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  const { currentUser, setCurrentScreen } = useApp();

  // Check if Paystack script is loaded
  useEffect(() => {
    const checkPaystack = () => {
      if (typeof window.PaystackPop !== 'undefined') {
        console.log('✅ Paystack script loaded successfully');
        setPaystackLoaded(true);
      } else {
        console.error('❌ Paystack script not found');
        setError('Paystack is not loaded. Please refresh the page.');
      }
    };

    checkPaystack();
    const timer = setTimeout(checkPaystack, 1000);
    return () => clearTimeout(timer);
  }, []);

  const currentPlan = membershipPlans[selectedPlan];
  const TRAINER_FEE = 1000000; // ₦10,000 in kobo
  const totalAmount = currentPlan.amount + (addTrainer ? TRAINER_FEE : 0);

  const formatAmount = (kobo) => (kobo / 100).toLocaleString();

  // Paystack payment handler - FIXED VERSION
  const handlePaystackPayment = () => {
    console.log('🔍 Starting Paystack payment...');
    setError(null);

    try {
      // Validation checks
      if (typeof window.PaystackPop === 'undefined') {
        setError('Paystack not loaded. Please refresh the page.');
        return;
      }

      if (!currentUser || !currentUser.email) {
        setError('User information missing. Please logout and login again.');
        return;
      }

      if (!totalAmount || totalAmount <= 0) {
        setError('Invalid payment amount.');
        return;
      }

      console.log('✅ Validation passed');
      console.log('📊 Payment details:', {
        email: currentUser.email,
        amount: totalAmount,
        plan: currentPlan.name,
        trainer: addTrainer,
      });

      const paymentRef = `GYM-${currentUser.id || currentUser._id}-${Date.now()}`;

      // Initialize Paystack - FIXED: Using arrow functions, not async
      const handler = window.PaystackPop.setup({
        key: paystackConfig.publicKey,
        email: currentUser.email,
        amount: totalAmount,
        currency: 'NGN',
        ref: paymentRef,
        metadata: {
          custom_fields: [
            {
              display_name: 'Membership Type',
              variable_name: 'membership_type',
              value: currentPlan.name,
            },
            {
              display_name: 'Duration',
              variable_name: 'duration',
              value: `${currentPlan.duration} days`,
            },
            {
              display_name: 'Trainer Add-on',
              variable_name: 'trainer_addon',
              value: addTrainer ? 'Yes' : 'No',
            },
          ],
        },
        callback: (response) => {
          console.log('✅ Payment successful:', response);
          setLoading(true);

          // Verify payment with backend
          API.post('/payments/verify', {
            reference: response.reference,
            membershipType: currentPlan.name,
            amount: totalAmount,
            duration: currentPlan.duration,
            trainerAddon: addTrainer,
          })
            .then((verify) => {
              console.log('✅ Verification successful:', verify.data);
              setPaymentSuccess(true);
              setLoading(false);
            })
            .catch((error) => {
              console.error('❌ Verification error:', error);
              setLoading(false);
              alert(
                '⚠️ Payment successful but verification failed.\n\n' +
                'Please contact support with reference:\n' +
                response.reference
              );
            });
        },
        onClose: () => {
          console.log('ℹ️ Payment window closed');
          alert('Payment cancelled. Click "Pay" to try again.');
        },
      });

      console.log('🚀 Opening Paystack window...');
      handler.openIframe();

    } catch (err) {
      console.error('❌ Paystack error:', err);
      setError('Failed to initialize payment: ' + err.message);
    }
  };

  // Cash payment handler
  const handleCashPayment = () => {
    setLoading(true);
    API.post('/payments', {
      amount: totalAmount / 100,
      membershipType: currentPlan.name,
      paymentMethod: 'Cash',
      duration: currentPlan.duration,
      trainerAddon: addTrainer,
    })
      .then(() => {
        setPaymentSuccess(true);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Cash payment error:', error);
        alert('Failed to record payment. Please try again.');
        setLoading(false);
      });
  };

  // Success Screen
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <CheckCircle size={80} className="text-green-500 mb-6" />
        <h2 className="text-3xl font-bold text-black mb-4">Payment Successful!</h2>
        <p className="text-gray-600 mb-2">Your {currentPlan.name} has been activated</p>
        <p className="text-sm text-gray-500 mb-2">Duration: {currentPlan.duration} days</p>
        {addTrainer && (
          <p className="text-sm text-green-600 font-semibold mb-2">✓ Personal Trainer included</p>
        )}
        <button
          onClick={() => setCurrentScreen('userDashboard')}
          className="mt-6 bg-black text-white py-3 px-8 rounded-full font-semibold hover:bg-gray-800 transition"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black mb-4"></div>
        <p className="text-lg text-gray-600">Processing payment...</p>
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
          <span className="font-bold">Select Membership Plan</span>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-semibold">⚠️ Payment Error:</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-600 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Paystack Loading Warning */}
        {!paystackLoaded && (
          <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800 font-semibold">⚠️ Loading payment system...</p>
            <p className="text-xs text-yellow-700 mt-1">
              Please wait. If this persists, refresh the page.
            </p>
          </div>
        )}

        {/* Membership Plans */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 mb-6">
          <h3 className="text-xl font-bold text-black mb-4">Choose Your Plan</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.keys(membershipPlans).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`border-2 rounded-xl p-4 text-left transition ${
                  selectedPlan === key
                    ? 'border-black bg-gray-50 shadow-md'
                    : 'border-gray-300 hover:border-black'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm">{membershipPlans[key].name}</span>
                  {selectedPlan === key && <CheckCircle size={20} className="text-black" />}
                </div>
                <p className="text-2xl font-bold text-black mb-1">
                  ₦{formatAmount(membershipPlans[key].amount)}
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  {membershipPlans[key].duration} Days
                </p>
                <p className="text-xs text-gray-500">{membershipPlans[key].description}</p>
              </button>
            ))}
          </div>

          {/* Trainer Add-on */}
          <div className="mt-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={addTrainer}
                onChange={(e) => setAddTrainer(e.target.checked)}
                className="mt-1 w-5 h-5 accent-black cursor-pointer"
              />
              <div className="flex-1">
                <div className="font-bold text-black mb-1">
                  Add Personal Trainer (+₦10,000)
                </div>
                <p className="text-xs text-gray-600">
                  Personalized workout plans and one-on-one guidance.
                </p>
              </div>
            </label>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm text-gray-600">Selected Plan:</p>
                <p className="text-lg font-bold text-black">{currentPlan.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Plan Price:</p>
                <p className="text-xl font-bold text-black">
                  ₦{formatAmount(currentPlan.amount)}
                </p>
              </div>
            </div>
            {addTrainer && (
              <div className="flex justify-between items-center border-t pt-2 mb-2">
                <p className="text-sm text-gray-600">Trainer Add-on:</p>
                <p className="text-lg font-bold text-black">₦10,000</p>
              </div>
            )}
            <div className="flex justify-between items-center border-t-2 border-blue-300 pt-3">
              <p className="text-base font-semibold text-gray-700">Total:</p>
              <p className="text-3xl font-bold text-black">
                ₦{formatAmount(totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 mb-6">
          <h3 className="text-xl font-bold text-black mb-4">Payment Method</h3>
          <div className="space-y-3">
            <button
              onClick={() => setSelectedMethod('paystack')}
              className={`w-full border-2 rounded-lg p-4 text-left transition ${
                selectedMethod === 'paystack'
                  ? 'border-black bg-gray-50'
                  : 'border-gray-300 hover:border-black'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">Paystack</div>
                  <div className="text-sm text-gray-500">Card, bank transfer, USSD</div>
                </div>
                {selectedMethod === 'paystack' && (
                  <CheckCircle size={24} className="text-black" />
                )}
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod('cash')}
              className={`w-full border-2 rounded-lg p-4 text-left transition ${
                selectedMethod === 'cash'
                  ? 'border-black bg-gray-50'
                  : 'border-gray-300 hover:border-black'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">Pay at Gym</div>
                  <div className="text-sm text-gray-500">Cash at reception</div>
                </div>
                {selectedMethod === 'cash' && (
                  <CheckCircle size={24} className="text-black" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={selectedMethod === 'paystack' ? handlePaystackPayment : handleCashPayment}
          disabled={loading || (selectedMethod === 'paystack' && !paystackLoaded)}
          className="w-full bg-black text-white py-4 px-6 rounded-full font-semibold hover:bg-gray-800 transition shadow-lg text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading
            ? 'Processing...'
            : selectedMethod === 'paystack'
            ? `Pay ₦${formatAmount(totalAmount)} with Paystack`
            : `Confirm Cash Payment - ₦${formatAmount(totalAmount)}`}
        </button>

        {selectedMethod === 'paystack' && (
          <p className="text-center text-xs text-gray-500 mt-4">
            🔒 Secure payment powered by Paystack
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentScreen;