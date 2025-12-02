import React, { useState } from 'react';
import { User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const PaymentControl = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const { users, handleTogglePayment } = useApp();

  const filteredUsers = filterStatus === 'all' 
    ? users 
    : users.filter(u => u.paymentStatus === filterStatus);

  return (
    <>
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filterStatus === 'all' 
              ? 'bg-black text-white' 
              : 'bg-white text-black border-2 border-gray-200 hover:border-black'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filterStatus === 'active' 
              ? 'bg-black text-white' 
              : 'bg-white text-black border-2 border-gray-200 hover:border-black'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilterStatus('due')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filterStatus === 'due' 
              ? 'bg-black text-white' 
              : 'bg-white text-black border-2 border-gray-200 hover:border-black'
          }`}
        >
          Due
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={24} className="text-gray-600" />
              </div>
              <div>
                <p className="font-bold text-black">{user.name}</p>
                <p className="text-xs text-gray-600">{user.membershipType}</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="font-bold text-black">₦{user.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`font-bold ${user.paymentStatus === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {user.paymentStatus === 'active' ? 'Paid' : 'Due'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Next Due:</span>
                <span className="font-semibold text-black">{user.nextDueDate}</span>
              </div>
            </div>

            <button
              onClick={() => handleTogglePayment(user.id)}
              className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
                user.paymentStatus === 'active'
                  ? 'bg-gray-200 text-black hover:bg-gray-300'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {user.paymentStatus === 'active' ? 'Mark as Due' : 'Mark as Paid'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default PaymentControl;