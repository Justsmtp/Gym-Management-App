import React from 'react';
import { AppProvider, useApp } from './context/AppContext';

// Auth Components
import SplashScreen from './components/Auth/SplashScreen';
import LoginScreen from './components/Auth/LoginScreen';
import RegisterScreen from './components/Auth/RegisterScreen';

// User Components
import UserDashboard from './components/User/UserDashboard';
import BarcodeScreen from './components/User/BarcodeScreen';
import PaymentScreen from './components/User/PaymentScreen';
import PaymentHistory from './components/User/PaymentHistory';

// Admin Components
import AdminDashboard from './components/Admin/AdminDashboard';

const AppRoutes = () => {
  const { currentScreen } = useApp();

  return (
    <div className="font-sans">
      {currentScreen === 'splash' && <SplashScreen />}
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'register' && <RegisterScreen />}
      {currentScreen === 'userDashboard' && <UserDashboard />}
      {currentScreen === 'barcode' && <BarcodeScreen />}
      {currentScreen === 'payment' && <PaymentScreen />}
      {currentScreen === 'paymentHistory' && <PaymentHistory />}
      {currentScreen === 'adminDashboard' && <AdminDashboard />}
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

export default App;