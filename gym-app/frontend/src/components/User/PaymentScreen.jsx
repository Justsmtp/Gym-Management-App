import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { paystackConfig, membershipPlans } from '../../config/paystack';
import API from '../../api/api';

const PaymentScreen = () => {
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('paystack');
  const [selectedPlan, setSelectedPlan] = useState('deluxe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Added for Paystack error handling

  const { currentUser, handlePayment, setCurrentScreen } = useApp();

  const currentPlan = membershipPlans[selectedPlan];

  // Paystack payment handler with error safety
  const handlePaystackPayment = () => {
    try {
      // Check if Paystack script is loaded
      if (typeof window.PaystackPop === 'undefined') {
        setError('Paystack is not loaded. Please refresh the page.');
        return;
      }

      const handler = window.PaystackPop.setup({
        key: paystackConfig.publicKey,
        email: currentUser?.email || 'user@example.com',
        amount: currentPlan.amount, // in kobo
        currency: paystackConfig.currency,
        ref: `GYM-${currentUser?.id}-${new Date().getTime()}`,
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
          ],
        },
        callback: async function (response) {
          console.log('Payment successful:', response);
          setLoading(true);
          try {
            const verify = await API.post('/payments/verify', {
              reference: response.reference,
              membershipType: currentPlan.name,
              amount: currentPlan.amount,
              duration: currentPlan.duration,
            });
            console.log('Verification response:', verify.data);
            handlePayment(currentPlan.duration);
            setPaymentSuccess(true);
          } catch (error) {
            console.error('Payment verification error:', error);
            alert(
              'Payment successful but verification failed. Please contact support with reference: ' +
                response.reference
            );
          } finally {
            setLoading(false);
          }
        },
        onClose: function () {
          alert('Payment window closed.');
        },
      });
      handler.openIframe();
    } catch (err) {
      console.error('Paystack initialization error:', err);
      setError('Failed to initialize payment. Please try again.');
    }
  };

  // Handle cash payment
  const handleCashPayment = async () => {
    setLoading(true);
    try {
      await API.post('/payments', {
        amount: currentPlan.amount / 100,
        membershipType: currentPlan.name,
        paymentMethod: 'Cash',
        duration: currentPlan.duration,
      });
      handlePayment(currentPlan.duration);
      setPaymentSuccess(true);
    } catch (error) {
      console.error('Cash payment error:', error);
      alert('Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (kobo) => (kobo / 100).toLocaleString();

  // Success Screen
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <CheckCircle size={80} className="text-green-500 mb-6" />
        <h2 className="text-3xl font-bold text-black mb-4">Payment Successful!</h2>
        <p className="text-gray-600 mb-2">Your {currentPlan.name} has been activated</p>
        <p className="text-sm text-gray-500 mb-2">Duration: {currentPlan.duration} days</p>
        <p className="text-sm text-gray-500 mb-8">Next due date: {currentUser?.nextDueDate}</p>
        <button
          onClick={() => setCurrentScreen('userDashboard')}
          className="bg-black text-white py-3 px-8 rounded-full font-semibold hover:bg-gray-800 transition"
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
        <p className="text-lg text-gray-600">Processing your payment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <p className="text-xs text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-600 underline"
            >
              Dismiss
            </button>
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
                className={`border-2 rounded-xl p-4 text-left transition relative ${
                  selectedPlan === key
                    ? 'border-black bg-gray-50 shadow-md'
                    : 'border-gray-300 hover:border-black'
                }`}
              >
                {membershipPlans[key].highlight && (
                  <div
                    className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-full font-semibold ${
                      membershipPlans[key].highlightColor || 'bg-green-500'
                    }`}
                  >
                    {membershipPlans[key].highlight}
                  </div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm">{membershipPlans[key].name}</span>
                  {selectedPlan === key && (
                    <CheckCircle size={20} className="text-black" />
                  )}
                </div>
                <p className="text-2xl font-bold text-black mb-1">
                  ₦{formatAmount(membershipPlans[key].amount)}
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  {membershipPlans[key].duration} Days Access
                </p>
                <div className="text-xs text-gray-500">
                  {membershipPlans[key].description}
                </div>
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Selected Plan:</p>
                <p className="text-lg font-bold text-black">{currentPlan.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount:</p>
                <p className="text-2xl font-bold text-black">
                  ₦{formatAmount(currentPlan.amount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/*Payment Method */}
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
                  <div className="text-sm text-gray-500">
                    Pay with card, bank transfer, or USSD
                  </div>
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
                  <div className="text-sm text-gray-500">
                    Pay cash at the gym reception
                  </div>
                </div>
                {selectedMethod === 'cash' && (
                  <CheckCircle size={24} className="text-black" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/*Pay Button */}
        <button
          onClick={
            selectedMethod === 'paystack'
              ? handlePaystackPayment
              : handleCashPayment
          }
          disabled={loading}
          className="w-full bg-black text-white py-4 px-6 rounded-full font-semibold hover:bg-gray-800 transition shadow-lg text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading
            ? 'Processing...'
            : selectedMethod === 'paystack'
            ? `Pay ₦${formatAmount(currentPlan.amount)} with Paystack`
            : `Confirm Cash Payment - ₦${formatAmount(currentPlan.amount)}`}
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
