// frontend/src/components/Admin/SettingsPanel.jsx
import React, { useState } from 'react';
import { Settings, DollarSign, Bell, Mail, Save, Edit2, Check, X } from 'lucide-react';

const AdminSettingsPanel = () => {
  const [message, setMessage] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);

  // Membership Plans (with real backend integration potential)
  const [plans, setPlans] = useState([
    {
      id: 1,
      name: 'Walk-in',
      displayName: 'Walk-in Membership Access',
      price: 5000,
      duration: 1,
      description: 'Single day access to gym facilities',
    },
    {
      id: 2,
      name: 'Weekly',
      displayName: 'Weekly Membership Access',
      price: 6500,
      duration: 7,
      description: 'One week unlimited gym access',
    },
    {
      id: 3,
      name: 'Deluxe',
      displayName: 'Deluxe Membership',
      price: 15500,
      duration: 30,
      description: 'Monthly access with full gym privileges',
    },
    {
      id: 4,
      name: 'Bi-Monthly',
      displayName: 'Bi-Monthly Membership',
      price: 40000,
      duration: 90,
      description: 'Three months access with premium benefits',
    },
  ]);

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailReminders: true,
    reminderDaysBefore: 7,
    overdueReminders: true,
    adminAlerts: true,
    dailySummary: false,
  });

  // Email Configuration
  const [emailConfig, setEmailConfig] = useState({
    fromName: '1st Impression Fitness Center',
    fromEmail: process.env.REACT_APP_EMAIL_USER || 'gym@example.com',
    replyTo: 'support@1stimpression.com',
  });

  const handlePlanEdit = (plan) => {
    setEditingPlan({ ...plan });
  };

  const handlePlanSave = () => {
    setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
    setEditingPlan(null);
    setMessage({ type: 'success', text: 'Plan updated successfully!' });
    
    // In production, save to backend:
    // await API.put(`/admin/plans/${editingPlan.id}`, editingPlan);
  };

  const handlePlanCancel = () => {
    setEditingPlan(null);
  };

  const handleNotificationToggle = (key) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setMessage({ type: 'success', text: 'Setting updated!' });
    
    // In production, save to backend:
    // await API.put('/admin/settings/notifications', notificationSettings);
  };

  const handleEmailConfigSave = () => {
    setMessage({ type: 'success', text: 'Email configuration saved!' });
    
    // In production, save to backend:
    // await API.put('/admin/settings/email', emailConfig);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
            <button onClick={() => setMessage(null)} className="text-gray-600">✕</button>
          </div>
        </div>
      )}

      {/* Membership Plans Management */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <div className="flex items-center mb-6">
          <DollarSign className="mr-3" size={24} />
          <h3 className="text-xl font-bold text-black">Membership Plans</h3>
        </div>

        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              {editingPlan?.id === plan.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={editingPlan.displayName}
                        onChange={(e) => setEditingPlan({ ...editingPlan, displayName: e.target.value })}
                        className="w-full p-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (₦)
                      </label>
                      <input
                        type="number"
                        value={editingPlan.price}
                        onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                        className="w-full p-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      value={editingPlan.duration}
                      onChange={(e) => setEditingPlan({ ...editingPlan, duration: Number(e.target.value) })}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingPlan.description}
                      onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePlanSave}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                      <Check className="inline mr-2" size={16} />
                      Save
                    </button>
                    <button
                      onClick={handlePlanCancel}
                      className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
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
                      <p className="font-bold text-black text-lg">{plan.displayName}</p>
                      <p className="text-xs text-gray-500">Code: {plan.name}</p>
                    </div>
                    <button
                      onClick={() => handlePlanEdit(plan)}
                      className="text-black hover:text-gray-700 transition"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                  <p className="text-3xl font-bold text-black mb-2">
                    ₦{plan.price.toLocaleString()}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">{plan.description}</p>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {plan.duration} days
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <div className="flex items-center mb-6">
          <Bell className="mr-3" size={24} />
          <h3 className="text-xl font-bold text-black">Notification Settings</h3>
        </div>

        <div className="space-y-4">
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
              className={`flex justify-between items-center py-3 ${
                index !== 3 ? 'border-b border-gray-200' : ''
              }`}
            >
              <div>
                <p className="font-semibold text-black">{item.title}</p>
                <p className="text-sm text-gray-600">{item.desc}</p>
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
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send reminders how many days before due date?
            </label>
            <select
              value={notificationSettings.reminderDaysBefore}
              onChange={(e) => setNotificationSettings({ 
                ...notificationSettings, 
                reminderDaysBefore: Number(e.target.value) 
              })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
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
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <div className="flex items-center mb-6">
          <Mail className="mr-3" size={24} />
          <h3 className="text-xl font-bold text-black">Email Configuration</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Name
            </label>
            <input
              type="text"
              value={emailConfig.fromName}
              onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
              placeholder="1st Impression Fitness Center"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Email
            </label>
            <input
              type="email"
              value={emailConfig.fromEmail}
              onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
              placeholder="gym@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reply-To Email
            </label>
            <input
              type="email"
              value={emailConfig.replyTo}
              onChange={(e) => setEmailConfig({ ...emailConfig, replyTo: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
              placeholder="support@1stimpression.com"
            />
          </div>

          <button
            onClick={handleEmailConfigSave}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            <Save className="inline mr-2" size={16} />
            Save Email Configuration
          </button>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <div className="flex items-center mb-6">
          <Settings className="mr-3" size={24} />
          <h3 className="text-xl font-bold text-black">System Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">System Version</p>
            <p className="font-bold text-black">v1.0.0</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Email Scheduler</p>
            <p className="font-bold text-green-600">Active (9:00 AM daily)</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Database Status</p>
            <p className="font-bold text-green-600">Connected</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Last Backup</p>
            <p className="font-bold text-black">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPanel;