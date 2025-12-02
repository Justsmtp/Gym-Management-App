import React from 'react';
import { useApp } from '../../context/AppContext';

const SplashScreen = () => {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="z-10 text-center">
        <div className="mb-8">
          {/* Replace Dumbbell with Logo */}
          <img 
            src="/logo.png" 
            alt="1st Impression Fitness Center" 
            className="w-40 h-40 mx-auto mb-4 object-contain"
          />
          <h1 className="text-4xl font-bold text-black mb-2">1st Impression</h1>
          <p className="text-2xl text-gray-700">Fitness Center</p>
        </div>
        
        <div className="space-y-4 mt-12">
          <button
            onClick={() => setCurrentScreen('login')}
            className="w-64 bg-black text-white py-3 px-6 rounded-full font-semibold hover:bg-gray-800 transition shadow-lg"
          >
            Login
          </button>
          <button
            onClick={() => setCurrentScreen('register')}
            className="w-64 bg-white text-black border-2 border-black py-3 px-6 rounded-full font-semibold hover:bg-gray-100 transition"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;