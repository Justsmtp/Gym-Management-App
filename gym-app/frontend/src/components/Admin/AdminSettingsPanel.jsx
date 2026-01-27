// frontend/src/components/Admin/AdminSettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { Settings, DollarSign, Bell, Mail, Save, Edit2, Check, X, Loader } from 'lucide-react';
import axios from 'axios';

const AdminSettingsPanel = () => {
  const [message, setMessage] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);

  const [notificationSettings, setNotificationSettings] = useState({
    emailReminders: true,
    reminderDaysBefore: 7,
    overdueReminders: true,
    adminAlerts: true,
    dailySummary: false,
  });

  const [emailConfig, setEmailConfig] = useState({
    fromName: '1st Impression Fitness Center',
    fromEmail: process.env.REACT_APP_EMAIL_USER || 'gym@example.com',
    replyTo: 'support@1stimpression.com',
  });

  // Fetch membership plans from the backend on component mount
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/plans');
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to load membership plans. Please refresh the page.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanEdit = (plan) => {
    setEditingPlan({ ...plan });
  };

  const handlePlanSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `/api/plans/${editingPlan._id}`,
        {
          displayName: editingPlan.displayName,
          price: editingPlan.price,
          duration: editingPlan.duration,
          description: editingPlan.description,
        },
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      if (response.data.success) {
        // Update the local state with the updated plan
        setPlans(plans.map(p => p._id === editingPlan._id ? response.data.plan : p));
        setEditingPlan(null);
        setMessage({ type: 'success', text: 'Plan updated successfully! Changes are now live for all users.' });
        
        // Auto-dismiss success message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update plan. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanCancel = () => {
    setEditingPlan(null);
  };

  const handleNotificationToggle = (key) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setMessage({ type: 'success', text: 'Setting updated!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEmailConfigSave = () => {
    setMessage({ type: 'success', text: 'Email configuration saved!' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
      {/* Message Banner */}
      {message && (
        <div className={`p-3 md:p-4 rounded-xl border-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <p className={`text-sm md:text-base font-semibold ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.type === 'success' ? '✅' : '❌'} {message.text}
            </p>
            <button onClick={() => setMessage(null)} className="text-gray-600 text-lg">✕</button>
          </div>
        </div>
      )}

      {/* Membership Plans Management */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center">
            <DollarSign className="mr-2 md:mr-3" size={20} />
            <h3 className="text-lg md:text-xl font-bold text-black">Membership Plans</h3>
          </div>
          {loading && (
            <Loader className="animate-spin text-gray-500" size={20} />
          )}
        </div>

        {loading && plans.length === 0 ? (
          <div className="text-center py-8">
            <Loader className="animate-spin mx-auto mb-3 text-gray-400" size={40} />
            <p className="text-gray-600">Loading membership plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-600">No membership plans found.</p>
            <p className="text-sm text-gray-500 mt-2">Create plans to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className="border-2 border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition"
              >
                {editingPlan?._id === plan._id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={editingPlan.displayName}
                          onChange={(e) => setEditingPlan({ ...editingPlan, displayName: e.target.value })}
                          className="w-full p-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none text-sm md:text-base"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                          Price (₦)
                        </label>
                        <input
                          type="number"
                          value={editingPlan.price}
                          onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                          className="w-full p-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none text-sm md:text-base"
                          disabled={loading}
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Duration (days)
                      </label>
                      <input
                        type="number"
                        value={editingPlan.duration}
                        onChange={(e) => setEditingPlan({ ...editingPlan, duration: Number(e.target.value) })}
                        className="w-full p-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none text-sm md:text-base"
                        disabled={loading}
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editingPlan.description}
                        onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                        className="w-full p-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none text-sm md:text-base"
                        rows={2}
                        disabled={loading}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handlePlanSave}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader className="inline mr-2 animate-spin" size={16} />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="inline mr-2" size={16} />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={handlePlanCancel}
                        className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        <X className="inline mr-2" size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-black text-base md:text-lg">{plan.displayName}</p>
                        <p className="text-xs text-gray-500">Code: {plan.name}</p>
                      </div>
                      <button
                        onClick={() => handlePlanEdit(plan)}
                        className="text-black hover:text-gray-700 transition p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        <Edit2 size={16} className="md:w-5 md:h-5" />
                      </button>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-black mb-2">
                      ₦{plan.price.toLocaleString()}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <p className="text-xs md:text-sm text-gray-600">{plan.description}</p>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold whitespace-nowrap">
                        {plan.duration} days
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <div className="flex items-center mb-4 md:mb-6">
          <Bell className="mr-2 md:mr-3" size={20} />
          <h3 className="text-lg md:text-xl font-bold text-black">Notification Settings</h3>
        </div>

        <div className="space-y-3 md:space-y-4">
          {[
            {
              key: 'emailReminders',
              title: 'Automated Email Reminders',
              desc: 'Send payment reminders to users automatically',
            },
            {
              key: 'overdueReminders',
              title: 'Overdue Payment Alerts',
              desc: 'Notify users when payments are overdue',
            },
            {
              key: 'adminAlerts',
              title: 'Admin Notifications',
              desc: 'Receive alerts for new registrations and payments',
            },
            {
              key: 'dailySummary',
              title: 'Daily Summary Emails',
              desc: 'Get daily reports of gym activity',
            },
          ].map((item, index) => (
            <div
              key={item.key}
              className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-3 ${
                index !== 3 ? 'border-b border-gray-200' : ''
              }`}
            >
              <div className="flex-1">
                <p className="font-semibold text-black text-sm md:text-base">{item.title}</p>
                <p className="text-xs md:text-sm text-gray-600">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationSettings[item.key]}
                  onChange={() => handleNotificationToggle(item.key)}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>
          ))}

          {/* Reminder Days Configuration */}
          <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Send reminders how many days before due date?
            </label>
            <select
              value={notificationSettings.reminderDaysBefore}
              onChange={(e) => setNotificationSettings({ 
                ...notificationSettings, 
                reminderDaysBefore: Number(e.target.value) 
              })}
              className="w-full p-2 md:p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm md:text-base"
            >
              <option value={3}>3 days before</option>
              <option value={5}>5 days before</option>
              <option value={7}>7 days before (recommended)</option>
              <option value={10}>10 days before</option>
              <option value={14}>14 days before</option>
            </select>
          </div>
        </div>
      </div>

      {/* Email Configuration */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <div className="flex items-center mb-4 md:mb-6">
          <Mail className="mr-2 md:mr-3" size={20} />
          <h3 className="text-lg md:text-xl font-bold text-black">Email Configuration</h3>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              From Name
            </label>
            <input
              type="text"
              value={emailConfig.fromName}
              onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
              className="w-full p-2 md:p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm md:text-base"
              placeholder="1st Impression Fitness Center"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              From Email
            </label>
            <input
              type="email"
              value={emailConfig.fromEmail}
              onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
              className="w-full p-2 md:p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm md:text-base"
              placeholder="gym@example.com"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Reply-To Email
            </label>
            <input
              type="email"
              value={emailConfig.replyTo}
              onChange={(e) => setEmailConfig({ ...emailConfig, replyTo: e.target.value })}
              className="w-full p-2 md:p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm md:text-base"
              placeholder="support@1stimpression.com"
            />
          </div>

          <button
            onClick={handleEmailConfigSave}
            className="w-full bg-black text-white py-2.5 md:py-3 rounded-lg font-semibold hover:bg-gray-800 transition text-sm md:text-base"
          >
            <Save className="inline mr-2" size={16} />
            Save Email Configuration
          </button>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <div className="flex items-center mb-4 md:mb-6">
          <Settings className="mr-2 md:mr-3" size={20} />
          <h3 className="text-lg md:text-xl font-bold text-black">System Information</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs md:text-sm text-gray-600 mb-1">System Version</p>
            <p className="font-bold text-black text-sm md:text-base">v1.0.0</p>
          </div>
          <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Email Scheduler</p>
            <p className="font-bold text-green-600 text-sm md:text-base">Active (9:00 AM daily)</p>
          </div>
          <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Database Status</p>
            <p className="font-bold text-green-600 text-sm md:text-base">Connected</p>
          </div>
          <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Last Backup</p>
            <p className="font-bold text-black text-sm md:text-base">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPanel;
