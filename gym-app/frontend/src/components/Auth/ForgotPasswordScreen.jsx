// frontend/src/components/Auth/ForgotPasswordScreen.jsx
import React, { useState } from 'react';
import { Loader, ArrowLeft, Mail, CheckCircle, Key } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import API from '../../api/api';

const ForgotPasswordScreen = () => {
  const { setCurrentScreen } = useApp();
  const [step, setStep] = useState('request'); // 'request', 'token', 'success'
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Step 1: Request reset token
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setMessage('Reset code sent to your email! Check your inbox (and spam folder).');
        setStep('token');
      } else {
        setError(response.data.message || 'Failed to send reset code');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to send reset code. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password with token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!resetToken || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/auth/reset-password', {
        email,
        resetToken,
        newPassword
      });
      
      if (response.data.success) {
        setMessage('Password reset successful! You can now login with your new password.');
        setStep('success');
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gray-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Back Button */}
      <button
        onClick={() => setCurrentScreen('login')}
        className="absolute top-6 left-6 z-20 text-white hover:text-gray-300 transition flex items-center gap-2 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-semibold">Back to Login</span>
      </button>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {/* Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-white blur-xl opacity-30 rounded-full"></div>
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center relative z-10">
                  <Key size={32} className="text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-2">
                {step === 'request' && 'Reset Password'}
                {step === 'token' && 'Enter Reset Code'}
                {step === 'success' && 'Success!'}
              </h2>
              <p className="text-gray-300">
                {step === 'request' && "Enter your email to receive a reset code"}
                {step === 'token' && "Check your email for the 6-digit code"}
                {step === 'success' && "Your password has been reset"}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur-sm">
                <p className="text-sm text-red-200 font-semibold">⚠️ {error}</p>
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl backdrop-blur-sm">
                <p className="text-sm text-green-200 font-semibold">✅ {message}</p>
              </div>
            )}

            {/* Step 1: Request Reset */}
            {step === 'request' && (
              <form onSubmit={handleRequestReset} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Mail size={16} />
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none transition backdrop-blur-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-xl hover:shadow-white/20 hover:scale-[1.02] transition-all duration-300"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="animate-spin mr-2" size={20} />
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Enter Token and New Password */}
            {step === 'token' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Key size={16} />
                    Reset Code
                  </label>
                  <input
                    required
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none transition backdrop-blur-sm text-center text-2xl tracking-widest font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-2">Check your email for the code</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    New Password
                  </label>
                  <input
                    required
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none transition backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Confirm Password
                  </label>
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none transition backdrop-blur-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-xl hover:shadow-white/20 hover:scale-[1.02] transition-all duration-300"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="animate-spin mr-2" size={20} />
                      Resetting...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRequestReset}
                  disabled={loading}
                  className="w-full text-white text-sm hover:underline"
                >
                  Didn't receive code? Resend
                </button>
              </form>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircle size={64} className="text-green-400" />
                </div>
                <p className="text-white text-lg">
                  Your password has been successfully reset!
                </p>
                <button
                  onClick={() => setCurrentScreen('login')}
                  className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-100 shadow-xl hover:shadow-white/20 hover:scale-[1.02] transition-all duration-300"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
