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

  const { currentUser, setCurrentUser, setCurrentScreen } = useApp();

  useEffect(() => {
    const checkPaystack = () => {
      if (typeof window.PaystackPop !== 'undefined') {
        setPaystackLoaded(true);
      } else {
        setError('Paystack failed to load. Refresh the page.');
      }
    };

    checkPaystack();
    const timer = setTimeout(checkPaystack, 1500);
    return () => clearTimeout(timer);
  }, []);

  const currentPlan = membershipPlans[selectedPlan];
  const TRAINER_FEE = 1000000; // ₦10,000 in kobo
  const totalAmount = currentPlan.amount + (addTrainer ? TRAINER_FEE : 0);

  const formatAmount = (kobo) => (kobo / 100).toLocaleString();

  // ----------------------------
  // Paystack Payment
  // ----------------------------
  const handlePaystackPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      if (typeof window.PaystackPop === 'undefined')
        throw new Error('Paystack is not loaded. Refresh and try again.');

      if (!currentUser?.email) throw new Error('User email missing.');

      const backendMembershipType = currentPlan.name;
      const reference = `GYM-${currentUser._id}-${Date.now()}`;

      window.PaystackPop.setup({
        key: paystackConfig.publicKey,
        email: currentUser.email,
        amount: totalAmount,
        currency: 'NGN',
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: 'Membership Type',
              variable_name: 'membership_type',
              value: backendMembershipType
            },
            {
              display_name: 'Duration',
              variable_name: 'duration',
              value: `${currentPlan.duration} days`
            },
            {
              display_name: 'Trainer Add-on',
              variable_name: 'trainer_addon',
              value: addTrainer ? 'Yes' : 'No'
            }
          ],
        },

        // Paystack requires FUNCTION(), NOT arrow function
        callback: async function (response) {
          try {
            const verifyResponse = await API.post('/payments/verify', {
              reference: response.reference,
              membershipType: backendMembershipType,
              amount: totalAmount,
              duration: currentPlan.duration,
              trainerAddon: addTrainer,
            });

            if (verifyResponse.data.success && verifyResponse.data.user) {
              const updatedUser = { ...currentUser, ...verifyResponse.data.user };
              setCurrentUser(updatedUser);
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }

            setPaymentSuccess(true);
            setLoading(false);

          } catch (error) {
            alert(
              `Payment succeeded, but verification failed.\nReference: ${response.reference}`
            );
            setLoading(false);
          }
        },

        // Paystack requires FUNCTION(), NOT arrow function
        onClose: function () {
          if (!paymentSuccess) {
            alert('Payment window closed. Try again.');
          }
          setLoading(false);
        }
      }).openIframe();

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ----------------------------
  // Cash Payment
  // ----------------------------
  const handleCashPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const backendMembershipType = currentPlan.name;

      const response = await API.post('/payments', {
        amount: totalAmount / 100,
        membershipType: backendMembershipType,
        paymentMethod: 'Cash',
        duration: currentPlan.duration,
        trainerAddon: addTrainer,
      });

      if (response.data.success && response.data.user) {
        const updatedUser = { ...currentUser, ...response.data.user };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }

      setPaymentSuccess(true);
      setLoading(false);

    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to record cash payment';
      setError(msg);
      alert(msg);
      setLoading(false);
    }
  };

  // ----------------------------
  // Render Screens
  // ----------------------------

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-6">
        <CheckCircle size={64} className="text-green-500 mb-6" />
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">
          Payment Successful!
        </h2>
        <p className="text-gray-600 mb-2 text-center">
          Your {currentPlan.displayName || currentPlan.name} is now active
        </p>
        <p className="text-sm text-gray-500 mb-2">Duration: {currentPlan.duration} days</p>

        {addTrainer && (
          <p className="text-sm text-green-600 font-semibold mb-2">
            ✓ Personal Trainer included
          </p>
        )}

        <button
          onClick={() => setCurrentScreen('userDashboard')}
          className="mt-6 bg-black text-white py-3 px-6 rounded-full font-semibold hover:bg-gray-800"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-black mb-4"></div>
        <p className="text-base text-gray-600">Processing payment...</p>
        <p className="text-xs text-gray-500 mt-1">Do not close this window</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-black text-white p-4 md:p-6">
        <div className="max-w-4xl mx-auto flex justify-between">
          <button
            onClick={() => setCurrentScreen('userDashboard')}
            className="text-white text-sm"
          >
            ← Back
          </button>
          <span className="font-bold">Select Membership Plan</span>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!paystackLoaded && selectedMethod === 'paystack' && (
          <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
            <p className="text-yellow-700 text-sm">
              Loading payment engine... refresh if this persists.
            </p>
          </div>
        )}

        {/* --- Plans UI --- */}
        {/* (UI unchanged — keeping your same structure) */}

        {/* Payment button */}
        <button
          onClick={selectedMethod === 'paystack' ? handlePaystackPayment : handleCashPayment}
          disabled={loading || (selectedMethod === 'paystack' && !paystackLoaded)}
          className="w-full bg-black text-white py-3 rounded-full font-semibold mt-6 disabled:bg-gray-400"
        >
          {loading
            ? 'Processing...'
            : selectedMethod === 'paystack'
            ? `Pay ₦${formatAmount(totalAmount)} with Paystack`
            : `Confirm Cash Payment - ₦${formatAmount(totalAmount)}`}
        </button>

        {selectedMethod === 'paystack' && (
          <p className="text-center text-xs text-gray-500 mt-2">
            🔒 Secure payment powered by Paystack
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentScreen;
