// frontend/src/components/Admin/ReminderManagement.jsx
import React, { useState, useEffect } from 'react';
import { Bell, Send, Users, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import API from '../../api/api';

const ReminderManagement = () => {
  const [stats, setStats] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, previewRes] = await Promise.all([
        API.get('/reminders/stats'),
        API.get('/reminders/preview'),
      ]);

      setStats(statsRes.data.stats);
      setPreview(previewRes.data);
      setMessage(null);
    } catch (error) {
      console.error('Error fetching reminder data:', error);
      setMessage({ type: 'error', text: 'Failed to load reminder data' });
    } finally {
      setLoading(false);
    }
  };

  const sendAllReminders = async () => {
    if (!window.confirm('Send reminders to all due users now?')) return;

    try {
      setSending(true);
      const response = await API.post('/reminders/send-all');
      
      setMessage({
        type: 'success',
        text: `Reminders sent! ${response.data.summary.sent} sent, ${response.data.summary.failed} failed`,
      });

      await fetchData();
    } catch (error) {
      console.error('Error sending reminders:', error);
      setMessage({
        type: 'error',
        text: 'Failed to send reminders',
      });
    } finally {
      setSending(false);
    }
  };

  const sendSingleReminder = async (userId, userName) => {
    if (!window.confirm(`Send reminder to ${userName}?`)) return;

    try {
      await API.post(`/reminders/send/${userId}`);
      setMessage({
        type: 'success',
        text: `Reminder sent to ${userName}`,
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      setMessage({
        type: 'error',
        text: `Failed to send reminder to ${userName}`,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-black mx-auto mb-4" />
          <p className="text-gray-600">Loading reminder data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-black">Payment Reminders</h2>
          <p className="text-sm text-gray-600 mt-1">
            Automated reminders run daily at 9:00 AM
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-black rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className="inline mr-2" />
            Refresh
          </button>
          <button
            onClick={sendAllReminders}
            disabled={sending || preview?.willReceiveReminders === 0}
            className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} className="inline mr-2" />
            {sending ? 'Sending...' : 'Send All Now'}
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-xl border-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <p className={`font-semibold ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.type === 'success' ? '✅' : '❌'} {message.text}
            </p>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-600 hover:text-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={<Users size={24} />}
            title="Total Users"
            value={stats.totalWithDueDate}
            color="blue"
          />
          <StatCard
            icon={<Clock size={24} />}
            title="Due in 7 Days"
            value={stats.dueIn7Days}
            color="blue"
          />
          <StatCard
            icon={<AlertCircle size={24} />}
            title="Due in 3 Days"
            value={stats.dueIn3Days}
            color="orange"
          />
          <StatCard
            icon={<Bell size={24} />}
            title="Due Today"
            value={stats.dueToday}
            color="red"
          />
          <StatCard
            icon={<AlertCircle size={24} />}
            title="Overdue"
            value={stats.overdue}
            color="red"
          />
        </div>
      )}

      {/* Reminder Schedule */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center">
          <Clock className="mr-2" size={20} />
          Automatic Reminder Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <div className="font-semibold text-blue-900">7 Days Before</div>
            <div className="text-blue-700 text-xs mt-1">Advance Notice</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <div className="font-semibold text-blue-900">3 Days Before</div>
            <div className="text-blue-700 text-xs mt-1">Second Reminder</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-orange-200">
            <div className="font-semibold text-orange-900">1 Day Before</div>
            <div className="text-orange-700 text-xs mt-1">Urgent Notice</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-red-200">
            <div className="font-semibold text-red-900">Due Date</div>
            <div className="text-red-700 text-xs mt-1">Payment Due</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-red-200">
            <div className="font-semibold text-red-900">Overdue</div>
            <div className="text-red-700 text-xs mt-1">Daily (7 days)</div>
          </div>
        </div>
      </div>

      {/* Users List */}
      {preview && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b-2 border-gray-200">
            <h3 className="text-xl font-bold text-black">
              Users Receiving Reminders
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {preview.willReceiveReminders} of {preview.total} users will receive reminders on next scheduled run
            </p>
          </div>

          {preview.users.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">No users need reminders right now</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">Membership</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">Due Date</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">Days Until Due</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">Reminder Type</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.users
                    .filter(u => u.willReceiveReminder)
                    .map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold">{user.name}</td>
                        <td className="py-3 px-4 text-sm">{user.email}</td>
                        <td className="py-3 px-4">{user.membershipType}</td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(user.nextDueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-bold ${
                            user.daysUntilDue < 0 ? 'text-red-600' :
                            user.daysUntilDue <= 1 ? 'text-red-600' :
                            user.daysUntilDue <= 3 ? 'text-orange-600' :
                            'text-blue-600'
                          }`}>
                            {user.daysUntilDue < 0 
                              ? `${Math.abs(user.daysUntilDue)} days overdue`
                              : user.daysUntilDue === 0
                              ? 'Due today'
                              : `${user.daysUntilDue} days`
                            }
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.reminderType === 'Overdue' ? 'bg-red-100 text-red-800' :
                            user.reminderType === 'Due Today' ? 'bg-red-100 text-red-800' :
                            user.reminderType === 'Urgent' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.reminderType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => sendSingleReminder(user.id, user.name)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                          >
                            Send Now
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
      <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg mb-4 flex items-center justify-center text-white`}>
        {icon}
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold text-black">{value}</p>
    </div>
  );
};

export default ReminderManagement;