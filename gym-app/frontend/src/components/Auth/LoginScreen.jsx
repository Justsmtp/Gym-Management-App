import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { handleLogin, setCurrentScreen } = useApp();

  const onSubmit = () => {
    handleLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
  src="/logo.png" 
  alt="1st Impression" 
  className="w-24 h-24 mx-auto mb-4 object-contain"
/>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black outline-none"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={onSubmit}
            className="w-full bg-black text-white py-3 px-6 rounded-full font-semibold hover:bg-gray-800 transition shadow-lg mt-6"
          >
            Login
          </button>

          <p className="text-center text-gray-600 text-sm mt-4">
            Don't have an account?{' '}
            <button onClick={() => setCurrentScreen('register')} className="text-black font-semibold">
              Register
            </button>
          </p>
          
          <p className="text-center text-gray-400 text-xs mt-4">
            Admin demo: admin@gym.com | User demo: john@example.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;