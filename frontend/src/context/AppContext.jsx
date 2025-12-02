import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [userType, setUserType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize: Load from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedUserType = localStorage.getItem('userType');
    const storedUsers = localStorage.getItem('users');
    
    if (storedUser && storedUserType) {
      setCurrentUser(JSON.parse(storedUser));
      setUserType(storedUserType);
      setIsAuthenticated(true);
      
      if (storedUserType === 'admin') {
        setCurrentScreen('adminDashboard');
      } else {
        setCurrentScreen('userDashboard');
      }
    }
    
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // Initialize with sample data only if no stored data
      const sampleUsers = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '08012345678',
          membershipType: 'Deluxe',
          price: 15500,
          paymentStatus: 'active',
          nextDueDate: '2025-12-02',
          barcode: 'GYM-2025-001',
          lastCheckIn: '2025-11-02 08:30 AM',
          checkInTime: null,
          checkOutTime: null
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '08087654321',
          membershipType: 'Bi-Monthly',
          price: 40000,
          paymentStatus: 'due',
          nextDueDate: '2025-11-05',
          barcode: 'GYM-2025-002',
          lastCheckIn: '2025-11-01 07:15 AM',
          checkInTime: null,
          checkOutTime: null
        }
      ];
      setUsers(sampleUsers);
      localStorage.setItem('users', JSON.stringify(sampleUsers));
    }
  }, []);

  // Save users to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [users]);

  const handleLogin = (email, password) => {
    if (email === 'admin@1stimpression.com' || email === 'admin@gym.com') {
      const adminData = { email, isAdmin: true, name: 'Admin' };
      
      setUserType('admin');
      setCurrentUser(adminData);
      setIsAuthenticated(true);
      setCurrentScreen('adminDashboard');
      
      // Persist to localStorage
      localStorage.setItem('currentUser', JSON.stringify(adminData));
      localStorage.setItem('userType', 'admin');
      
      return true;
    } else {
      const user = users.find(u => u.email === email);
      if (user) {
        setCurrentUser(user);
        setUserType('user');
        setIsAuthenticated(true);
        setCurrentScreen('userDashboard');
        
        // Persist to localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('userType', 'user');
        
        return true;
      }
    }
    return false;
  };

  const handleRegister = (formData) => {
    const barcode = `GYM-2025-${String(users.length + 1).padStart(3, '0')}`;
    const newUser = {
      id: users.length + 1,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      membershipType: formData.membershipType,
      price: formData.price || 15500,
      paymentStatus: 'active',
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      barcode: barcode,
      lastCheckIn: 'Not yet checked in',
      checkInTime: null,
      checkOutTime: null
    };
    
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    return barcode;
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setUserType(null);
    setIsAuthenticated(false);
    setCurrentScreen('splash');
    
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userType');
  };

  const handleCheckIn = () => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    let updatedUser;
    
    if (!currentUser.checkInTime) {
      updatedUser = {...currentUser, checkInTime: now};
    } else if (!currentUser.checkOutTime) {
      updatedUser = {...currentUser, checkOutTime: now};
    }
    
    if (updatedUser) {
      setCurrentUser(updatedUser);
      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      
      // Update localStorage
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      localStorage.setItem('users', JSON.stringify(updatedUsers));
    }
  };

  const handlePayment = (duration = 30) => {
    const updatedUser = {
      ...currentUser,
      paymentStatus: 'active',
      nextDueDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    setCurrentUser(updatedUser);
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    
    // Update localStorage
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const handleTogglePayment = (userId) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          paymentStatus: u.paymentStatus === 'active' ? 'due' : 'active',
          nextDueDate: u.paymentStatus === 'due' 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : u.nextDueDate
        };
      }
      return u;
    });
    
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const value = {
    currentScreen,
    setCurrentScreen,
    userType,
    setUserType,
    currentUser,
    setCurrentUser,
    users,
    setUsers,
    showSidebar,
    setShowSidebar,
    isAuthenticated,
    handleLogin,
    handleRegister,
    handleSignOut,
    handleCheckIn,
    handlePayment,
    handleTogglePayment
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};