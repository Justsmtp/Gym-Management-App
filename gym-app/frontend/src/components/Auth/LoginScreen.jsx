import React, { useState } from 'react';
import { Loader, ArrowLeft, Mail, Lock, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const LoginScreen = () => {
  const { handleLogin, setCurrentScreen, resendVerification } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');

  const onSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setResendMsg('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    const res = await handleLogin(email, password, isAdmin);
    setLoading(false);

    if (!res.success) {
      setError(res.message || 'Login failed');
      if (res.message && res.message.toLowerCase().includes('verify')) {
        setResendMsg('Your account is not verified. Click "Resend Verification" below.');
      }
    }
  };

  const handleResend = async () => {
    if (!email) {
      setResendMsg('Please enter your email address first');
      return;
    }

    setResending(true);
    setResendMsg('');
    const res = await resendVerification(email);
    setResending(false);

    if (res.success) {
      setResendMsg('✅ Verification email sent! Check your inbox (and spam folder).');
    } else {
      setResendMsg('❌ ' + (res.message || 'Failed to resend verification email'));
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
        onClick={() => setCurrentScreen('splash')}
        className="absolute top-6 left-6 z-20 text-white hover:text-gray-300 transition flex items-center gap-2 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-semibold">Back</span>
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
                <img
                  src="/logo.png"
                  alt="logo"
                  className="w-20 h-20 relative z-10 object-contain drop-shadow-2xl"
                />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Welcome Back</h2>
              <p className="text-gray-300">Login to continue your fitness journey</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur-sm">
                <p className="text-sm text-red-200 font-semibold">⚠️ {error}</p>
              </div>
            )}

            {/* Resend Message */}
            {resendMsg && (
              <div
                className={`mb-4 p-4 border rounded-xl backdrop-blur-sm ${
                  resendMsg.includes('✅')
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-yellow-500/20 border-yellow-500/50'
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    resendMsg.includes('✅') ? 'text-green-200' : 'text-yellow-200'
                  }`}
                >
                  {resendMsg}
                </p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2 items-center gap-2">
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

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2 items-center gap-2">
                  <Lock size={16} />
                  Password
                </label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-white/40 focus:outline-none transition backdrop-blur-sm"
                />
              </div>

              {/* Admin Checkbox */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    className="w-5 h-5 accent-white cursor-pointer"
                  />
                  <div className="flex items-center gap-2 text-white">
                    <Shield size={18} />
                    <span className="text-sm font-semibold">Login as Administrator</span>
                  </div>
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-xl hover:shadow-white/20 hover:scale-[1.02] transition-all duration-300"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader className="animate-spin mr-2" size={20} />
                    Signing in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-sm text-gray-400 bg-gradient-to-br from-gray-900 via-black to-gray-800">
                  or
                </span>
              </div>
            </div>

            {/* Registration Link */}
            <div className="text-center mb-4">
              <p className="text-gray-300">
                Don't have an account?{' '}
                <button
                  onClick={() => setCurrentScreen('register')}
                  className="text-white font-bold hover:underline"
                >
                  Register Now
                </button>
              </p>
            </div>

            {/* Resend Verification Section */}
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-sm text-blue-200 font-semibold mb-2 flex items-center gap-2">
                <Mail size={16} />
                Email Not Verified?
              </p>
              <p className="text-xs text-blue-300 mb-3">
                If you registered but didn't receive a verification email, enter your email above and click below:
              </p>
              <button
                onClick={handleResend}
                disabled={resending || !email}
                className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-blue-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {resending ? (
                  <span className="flex items-center justify-center">
                    <Loader className="animate-spin mr-2" size={16} />
                    Sending...
                  </span>
                ) : (
                  'Resend Verification Email'
                )}
              </button>
            </div>
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

export default LoginScreen;