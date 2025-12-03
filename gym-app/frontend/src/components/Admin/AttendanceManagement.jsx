/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { User, QrCode, CheckCircle, XCircle, Clock, Calendar, Search, RefreshCw } from 'lucide-react';
import API from '../../api/api';

const AttendanceManagement = () => {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    checkedIn: 0,
    checkedOut: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    fetchTodayAttendance();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTodayAttendance, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      setRefreshing(true);
      const response = await API.get('/attendance/today');
      const attendance = response.data.attendance || response.data || [];
      
      setTodayAttendance(attendance);
      
      // Calculate stats
      const checkedIn = attendance.filter(a => !a.checkOutTime).length;
      const checkedOut = attendance.filter(a => a.checkOutTime).length;
      
      setStats({
        totalToday: attendance.length,
        checkedIn,
        checkedOut
      });
      
      console.log('✅ Attendance loaded:', attendance.length);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    
    if (!barcode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a barcode' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await API.post('/attendance/checkin', { barcode: barcode.trim() });
      
      setMessage({
        type: 'success',
        text: `✅ ${response.data.user?.name || 'Member'} checked in successfully!`
      });
      
      // Refresh attendance list
      await fetchTodayAttendance();
      
      // Clear barcode input
      setBarcode('');
      
      // Refocus on input
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
      
    } catch (err) {
      console.error('Check-in error:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Check-in failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (userId) => {
    if (!window.confirm('Confirm check-out for this member?')) {
      return;
    }

    try {
      const response = await API.post('/attendance/checkout', { userId });
      
      setMessage({
        type: 'success',
        text: `✅ ${response.data.user?.name || 'Member'} checked out successfully!`
      });
      
      await fetchTodayAttendance();
      setTimeout(() => setMessage(null), 3000);
      
    } catch (err) {
      console.error('Check-out error:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Check-out failed'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-xl border-2 animate-fadeIn ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <p className={`font-semibold ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </p>
            <button onClick={() => setMessage(null)} className="text-gray-600 hover:text-gray-800">✕</button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Today"
          value={stats.totalToday}
          icon={<Calendar size={24} />}
          color="blue"
        />
        <StatCard
          title="Currently In"
          value={stats.checkedIn}
          icon={<CheckCircle size={24} />}
          color="green"
        />
        <StatCard
          title="Checked Out"
          value={stats.checkedOut}
          icon={<Clock size={24} />}
          color="gray"
        />
      </div>

      {/* Check-in Portal */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <div className="flex items-center mb-6">
          <QrCode className="mr-3" size={24} />
          <h3 className="text-xl font-bold text-black">Member Check-in Portal</h3>
        </div>

        <form onSubmit={handleCheckIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scan or Enter Member Barcode
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="GYM-XXXX-XXXX"
                  className="w-full p-4 pr-12 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-lg font-mono"
                  autoFocus
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
              <button
                type="submit"
                disabled={loading || !barcode.trim()}
                className="px-8 py-4 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  'Check In'
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Focus the input and scan the barcode with a barcode scanner
            </p>
          </div>
        </form>
      </div>

      {/* Today's Attendance List */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="p-6 border-b-2 border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-black">Today's Attendance Log</h3>
          <button
            onClick={fetchTodayAttendance}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Barcode</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Check-in</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Check-out</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {todayAttendance.map((record) => (
                <AttendanceRow
                  key={record._id}
                  record={record}
                  onCheckOut={handleCheckOut}
                />
              ))}
              {todayAttendance.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Clock size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-semibold">No check-ins today</p>
                    <p className="text-gray-400 text-sm mt-2">Members will appear here when they check in</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Attendance Row Component
const AttendanceRow = ({ record, onCheckOut }) => {
  const checkInTime = new Date(record.checkInTime);
  const checkOutTime = record.checkOutTime ? new Date(record.checkOutTime) : null;
  
  const getDuration = () => {
    if (!checkOutTime) return 'In gym';
    const diff = checkOutTime - checkInTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const isCheckedOut = !!record.checkOutTime;

  return (
    <tr className={`hover:bg-gray-50 ${isCheckedOut ? 'opacity-60' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
            <User size={20} className="text-gray-600" />
          </div>
          <div>
            <p className="font-semibold text-black">{record.user?.name || 'Unknown'}</p>
            <p className="text-xs text-gray-600">{record.user?.email || ''}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-mono text-sm text-black">{record.user?.barcode || '-'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-green-600 font-semibold">
          {checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {checkOutTime ? (
          <span className="text-sm text-red-600 font-semibold">
            {checkOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-700 font-medium">{getDuration()}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          isCheckedOut
            ? 'bg-gray-100 text-gray-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {isCheckedOut ? 'Checked Out' : 'In Gym'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {!isCheckedOut && (
          <button
            onClick={() => onCheckOut(record.user?._id)}
            className="text-sm text-red-600 hover:text-red-800 font-semibold hover:underline"
          >
            Check Out
          </button>
        )}
      </td>
    </tr>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    gray: 'bg-gray-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold text-black">{value}</p>
    </div>
  );
};

export default AttendanceManagement;
