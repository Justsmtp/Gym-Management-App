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

  // ----------------------------
  // Paystack payment handler
  // ----------------------------
  const handlePaystackPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting Paystack payment...');

      if (typeof window.PaystackPop === 'undefined') {
        throw new Error('Paystack not loaded. Please refresh the page.');
      }

      if (!currentUser || !currentUser.email) {
        throw new Error('User information missing. Please logout and login again.');
      }

      if (!totalAmount || totalAmount <= 0) {
        throw new Error('Invalid payment amount.');
      }

      // CRITICAL: Use backend type (name) not displayName
      const backendMembershipType = currentPlan.name; // e.g., "Walk-in" not "Walk-in Membership Access"
      
      console.log('✅ Validation passed');
      console.log('📊 Payment details:', {
        displayName: currentPlan.displayName,
        backendType: backendMembershipType,
        email: currentUser.email,
        amount: totalAmount,
        trainer: addTrainer
      });

      // Generate reference
      const reference = `GYM-${currentUser._id}-${Date.now()}`;
      
      console.log('🚀 Opening Paystack window...');

      // Open Paystack popup
      const handler = window.PaystackPop.setup({
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
              value: backendMembershipType // Use backend type
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
            },
          ],
        },
        callback: async (response) => {
          console.log('✅ Payment successful:', response);

          try {
            // Verify payment with backend - USE BACKEND TYPE
            console.log('🔍 Verifying payment with backend...');
            const verifyResponse = await API.post('/payments/verify', {
              reference: response.reference,
              membershipType: backendMembershipType, // CRITICAL: Use backend type
              amount: totalAmount,
              duration: currentPlan.duration,
              trainerAddon: addTrainer
            });

            console.log('✅ Verification successful:', verifyResponse.data);

            if (verifyResponse.data.success && verifyResponse.data.user) {
              const updatedUser = { ...currentUser, ...verifyResponse.data.user };
              setCurrentUser(updatedUser);
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }

            setPaymentSuccess(true);
            setLoading(false);
          } catch (verifyError) {
            console.error('❌ Verification error:', verifyError);
            const errorMessage = verifyError.response?.data?.message || verifyError.message || 'Unknown error';
            
            alert(
              '⚠️ Payment succeeded but verification failed.\n\n' +
              'Error: ' + errorMessage + '\n\n' +
              'Reference: ' + response.reference +
              '\n\nPlease contact support with this reference number.'
            );
            
            setLoading(false);
            setCurrentScreen('userDashboard');
          }
        },
        onClose: () => {
          console.log('ℹ️ Payment window closed');
          if (!paymentSuccess) {
            alert('Payment cancelled. Click "Pay" to try again.');
          }
          setLoading(false);
        },
      });

      handler.openIframe();

    } catch (err) {
      console.error('❌ Paystack initiation error:', err);
      setError(err.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  // ----------------------------
  // Cash payment handler
  // ----------------------------
  const handleCashPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('💵 Recording cash payment...');

      // CRITICAL: Use backend type
      const backendMembershipType = currentPlan.name;

      const response = await API.post('/payments', {
        amount: totalAmount / 100, // Convert kobo to naira
        membershipType: backendMembershipType, // Use backend type
        paymentMethod: 'Cash',
        duration: currentPlan.duration,
        trainerAddon: addTrainer,
      });

      console.log('✅ Cash payment response:', response.data);

      if (response.data.success && response.data.user) {
        const updatedUser = { ...currentUser, ...response.data.user };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }

      setPaymentSuccess(true);
      setLoading(false);
    } catch (error) {
      console.error('❌ Cash payment error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to record payment';
      setError(errorMessage);
      alert('Failed to record payment: ' + errorMessage);
      setLoading(false);
    }
  };

  // ----------------------------
  // Render
  // ----------------------------

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-6">
        <CheckCircle size={64} className="text-green-500 mb-6 md:w-20 md:h-20" />
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-4 text-center">Payment Successful!</h2>
        <p className="text-gray-600 mb-2 text-center">
          Your {currentPlan.displayName || currentPlan.name} has been activated
        </p>
        <p className="text-sm text-gray-500 mb-2">Duration: {currentPlan.duration} days</p>
        {addTrainer && (
          <p className="text-sm text-green-600 font-semibold mb-2">✓ Personal Trainer included</p>
        )}
        <button
          onClick={() => setCurrentScreen('userDashboard')}
          className="mt-6 bg-black text-white py-3 px-6 md:px-8 rounded-full font-semibold hover:bg-gray-800 transition text-sm md:text-base"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-6">
        <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-t-4 border-b-4 border-black mb-4"></div>
        <p className="text-base md:text-lg text-gray-600">Processing payment...</p>
        <p className="text-xs md:text-sm text-gray-500 mt-2">Please wait, do not close this window</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white p-4 md:p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={() => setCurrentScreen('userDashboard')}
            className="text-white hover:text-gray-300 text-sm md:text-base"
          >
            ← Back
          </button>
          <span className="font-bold text-sm md:text-base">Select Membership Plan</span>
          <div className="w-12 md:w-16"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {error && (
          <div className="mb-4 p-3 md:p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-sm font-semibold text-red-800">⚠️ Payment Error:</p>
            <p className="text-xs md:text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-600 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {!paystackLoaded && (
          <div className="mb-4 p-3 md:p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
            <p className="text-sm font-semibold text-yellow-800">⚠️ Loading payment system...</p>
            <p className="text-xs md:text-sm text-yellow-700 mt-1">
              Please wait. If this persists, refresh the page.
            </p>
          </div>
        )}

        {/* Membership Plans */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200 mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-black mb-4">Choose Your Plan</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {Object.keys(membershipPlans).map((key) => {
              const plan = membershipPlans[key];
              const displayText = plan.displayName || plan.name; // Fallback to name if no displayName
              
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`border-2 rounded-xl p-3 md:p-4 text-left transition ${
                    selectedPlan === key
                      ? 'border-black bg-gray-50 shadow-md'
                      : 'border-gray-300 hover:border-black'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm">{displayText}</span>
                    {selectedPlan === key && <CheckCircle size={18} className="text-black md:w-5 md:h-5" />}
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-black mb-1">
                    ₦{formatAmount(plan.amount)}
                  </p>
                  <p className="text-xs text-gray-600 mb-2">{plan.duration} Days</p>
                  <p className="text-xs text-gray-500">{plan.description}</p>
                </button>
              );
            })}
          </div>

          {/* Trainer Add-on */}
          <div className="mt-4 md:mt-6 p-3 md:p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={addTrainer}
                onChange={(e) => setAddTrainer(e.target.checked)}
                className="mt-1 w-5 h-5 accent-black cursor-pointer"
              />
              <div className="flex-1">
                <div className="font-bold text-black mb-1 text-sm md:text-base">
                  Add Personal Trainer (+₦10,000)
                </div>
                <p className="text-xs text-gray-600">
                  Personalized workout plans and one-on-one guidance.
                </p>
              </div>
            </label>
          </div>

          {/* Summary */}
          <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Selected Plan:</p>
                <p className="text-base md:text-lg font-bold text-black">
                  {currentPlan.displayName || currentPlan.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs md:text-sm text-gray-600">Plan Price:</p>
                <p className="text-lg md:text-xl font-bold text-black">
                  ₦{formatAmount(currentPlan.amount)}
                </p>
              </div>
            </div>
            {addTrainer && (
              <div className="flex justify-between items-center border-t pt-2 mb-2">
                <p className="text-xs md:text-sm text-gray-600">Trainer Add-on:</p>
                <p className="text-base md:text-lg font-bold text-black">₦10,000</p>
              </div>
            )}
            <div className="flex justify-between items-center border-t-2 border-blue-300 pt-3">
              <p className="text-sm md:text-base font-semibold text-gray-700">Total:</p>
              <p className="text-2xl md:text-3xl font-bold text-black">
                ₦{formatAmount(totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200 mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-black mb-4">Payment Method</h3>
          <div className="space-y-3">
            <button
              onClick={() => setSelectedMethod('paystack')}
              className={`w-full border-2 rounded-lg p-3 md:p-4 text-left transition ${
                selectedMethod === 'paystack'
                  ? 'border-black bg-gray-50'
                  : 'border-gray-300 hover:border-black'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-sm md:text-base">Paystack</div>
                  <div className="text-xs md:text-sm text-gray-500">Card, bank transfer, USSD</div>
                </div>
                {selectedMethod === 'paystack' && (
                  <CheckCircle size={20} className="text-black md:w-6 md:h-6" />
                )}
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod('cash')}
              className={`w-full border-2 rounded-lg p-3 md:p-4 text-left transition ${
                selectedMethod === 'cash'
                  ? 'border-black bg-gray-50'
                  : 'border-gray-300 hover:border-black'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-sm md:text-base">Pay at Gym</div>
                  <div className="text-xs md:text-sm text-gray-500">Cash at reception</div>
                </div>
                {selectedMethod === 'cash' && (
                  <CheckCircle size={20} className="text-black md:w-6 md:h-6" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={selectedMethod === 'paystack' ? handlePaystackPayment : handleCashPayment}
          disabled={loading || (selectedMethod === 'paystack' && !paystackLoaded)}
          className="w-full bg-black text-white py-3 md:py-4 px-4 md:px-6 rounded-full font-semibold hover:bg-gray-800 transition shadow-lg text-sm md:text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
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
