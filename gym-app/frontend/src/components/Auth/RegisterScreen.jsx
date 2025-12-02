import React, { useState } from 'react';
import { Dumbbell, CheckCircle, Loader } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { paystackConfig, membershipPlans } from '../../config/paystack';
import API from '../../api/api';

const RegisterScreen = () => {
  const [step, setStep] = useState(1); // 1: Form, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    membershipType: 'Deluxe',
    password: '',
    confirmPassword: ''
  });
  
  const [pendingUser, setPendingUser] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [newBarcode, setNewBarcode] = useState('');
  
  const { setCurrentScreen } = useApp();

  // Get selected plan details
  const getSelectedPlan = () => {
    const planKey = formData.membershipType === 'Deluxe' ? 'deluxe' : formData.membershipType;
    return membershipPlans[planKey] || membershipPlans.deluxe;
  };

  const selectedPlan = getSelectedPlan();

  // Step 1: Handle Registration Form Submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('All fields are required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Register user (creates pending user)
      const registerResponse = await API.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        membershipType: formData.membershipType
      });

      const userData = registerResponse.data.user;
      setPendingUser(userData);

      // Step 2: Initiate payment
      const paymentResponse = await API.post('/payments/initiate', {
        userId: userData.id,
        email: userData.email,
        amount: selectedPlan.amount, // in kobo
        membershipType: userData.membershipType,
        duration: userData.membershipDuration
      });

      setPaymentData(paymentResponse.data.payment);
      
      // Move to payment step
      setStep(2);
      setLoading(false);
      
      // Auto-trigger Paystack after 1 second
      setTimeout(() => {
        handlePaystackPayment();
      }, 1000);
      
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    }
  };

  // Step 2: Handle Paystack Payment using PaystackPop
  const handlePaystackPayment = () => {
    if (!paymentData) {
      setError('Payment data not available. Please try again.');
      return;
    }

    // Check if Paystack is loaded
    if (typeof window.PaystackPop === 'undefined') {
      setError('Payment system not loaded. Please refresh the page.');
      return;
    }

    const handler = window.PaystackPop.setup({
      key: paystackConfig.publicKey,
      email: paymentData.email,
      amount: paymentData.amount,
      ref: paymentData.paystackReference,
      currency: 'NGN',
      channels: paystackConfig.channels,
      metadata: {
        custom_fields: [
          {
            display_name: 'User ID',
            variable_name: 'user_id',
            value: pendingUser?.id
          },
          {
            display_name: 'Membership Type',
            variable_name: 'membership_type',
            value: formData.membershipType
          }
        ]
      },
      onClose: function() {
        setError('Payment cancelled. You can try again or contact support.');
      },
      callback: function(response) {
        // Payment successful, verify it
        verifyPayment(response.reference);
      }
    });

    handler.openIframe();
  };

  // Step 3: Verify Payment and Activate User
  const verifyPayment = async (reference) => {
    setLoading(true);
    
    try {
      // Verify payment with backend
      const verifyResponse = await API.post('/payments/verify', {
        reference: reference
      });

      const { user } = verifyResponse.data;
      
      setNewBarcode(user.barcode);
      setRegistrationComplete(true);
      setStep(3);
      setLoading(false);
      
    } catch (err) {
      setLoading(false);
      setError('Payment verification failed. Please contact support with reference: ' + reference);
      console.error('Verification error:', err);
    }
  };

  // Format amount
  const formatAmount = (kobo) => {
    return (kobo / 100).toLocaleString();
  };

  // Step 3: Success Screen
  if (registrationComplete && step === 3) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="mb-6">
            <CheckCircle size={80} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-3xl font-bold text-black mb-2">Registration Complete!</h2>
            <p className="text-gray-600">Your membership is now active</p>
          </div>

          <div className="bg-gray-50 border-2 border-black rounded-2xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Your Access Code</p>
            <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-4">
              <div className="text-5xl font-bold text-black tracking-wider">{newBarcode}</div>
            </div>
            <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg mx-auto flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-2">QR CODE</div>
                <div className="w-32 h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Scan this barcode at the gym entrance</p>
          </div>

          <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <p className="text-sm text-green-800 font-semibold mb-1">✅ What's Next?</p>
            <p className="text-xs text-green-700">
              You can now login with your email and password to access your dashboard and start your fitness journey!
            </p>
          </div>

          <button
            onClick={() => setCurrentScreen('login')}
            className="w-full bg-black text-white py-3 px-6 rounded-full font-semibold hover:bg-gray-800 transition shadow-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Payment Processing
  if (step === 2) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <Dumbbell size={60} className="mx-auto mb-4 text-black" />
          <h2 className="text-3xl font-bold text-black mb-2">Complete Payment</h2>
          <p className="text-gray-600 mb-8">Finalize your registration</p>

          {loading ? (
            <div className="mb-8">
              <Loader size={48} className="mx-auto animate-spin text-black mb-4" />
              <p className="text-gray-600">Processing payment...</p>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 mb-6">
                <p className="text-sm text-gray-600 mb-2">Registration Summary</p>
                <div className="mb-4">
                  <p className="text-lg font-bold text-black">{formData.name}</p>
                  <p className="text-sm text-gray-600">{formData.email}</p>
                </div>
                <div className="border-t-2 border-gray-200 pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Membership:</span>
                    <span className="font-semibold text-black">{formData.membershipType}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="font-semibold text-black">{selectedPlan.duration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-xl font-bold text-black">₦{formatAmount(selectedPlan.amount)}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                onClick={handlePaystackPayment}
                className="w-full bg-black text-white py-4 px-6 rounded-full font-semibold hover:bg-gray-800 transition shadow-lg mb-4"
              >
                Pay ₦{formatAmount(selectedPlan.amount)} with Paystack
              </button>

              <button
                onClick={() => setStep(1)}
                className="w-full bg-white text-black border-2 border-black py-3 px-6 rounded-full font-semibold hover:bg-gray-100 transition"
              >
                ← Back to Form
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Registration Form
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-md mx-auto">
        <button onClick={() => setCurrentScreen('splash')} className="mb-6 text-gray-600 hover:text-black">
          ← Back
        </button>

        <div className="text-center mb-8">
          <Dumbbell size={60} className="mx-auto mb-4 text-black" />
          <h1 className="text-3xl font-bold text-black mb-2">Create Account</h1>
          <p className="text-gray-600">Join 1st Impression Fitness Center</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black outline-none"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black outline-none"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black outline-none"
              placeholder="08012345678"
              pattern="[0-9]{11}"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Membership Type</label>
            <select
              value={formData.membershipType}
              onChange={(e) => setFormData({...formData, membershipType: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black outline-none"
            >
              <option value="WalkIn">Walk-in - ₦5,000 (1 day)</option>
              <option value="Weekly">Weekly - ₦6,500 (7 days)</option>
              <option value="Deluxe">Deluxe - ₦15,500 (30 days)</option>
              <option value="BiMonthly">Bi-Monthly - ₦40,000 (90 days)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black outline-none"
              placeholder="••••••••"
              minLength="6"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 font-semibold mb-1">📝 Next Step</p>
            <p className="text-xs text-blue-700">
              After submitting, you'll be redirected to complete payment via Paystack to activate your account.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 px-6 rounded-full font-semibold hover:bg-gray-800 transition shadow-lg mt-6 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Continue to Payment →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterScreen;