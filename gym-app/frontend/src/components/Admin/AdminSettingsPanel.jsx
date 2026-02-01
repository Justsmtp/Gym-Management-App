/* eslint-disable react-hooks/exhaustive-deps */
// frontend/src/components/Admin/AdminSettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { 
  Settings, DollarSign, Bell, Mail, Save, Edit2, Check, X, Loader,
  ChevronRight, ArrowLeft, Bug, AlertCircle, Clock, CheckCircle,
  XCircle, Trash2, Search, Copy} from 'lucide-react';
import api from '../../api/api';

const AdminSettingsPanel = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [message, setMessage] = useState(null);

  // Close modal handler
  const closeModal = () => {
    setActiveModal(null);
    setMessage(null);
  };

  // Settings menu items
  const settingsMenu = [
    {
      id: 'plans',
      icon: DollarSign,
      title: 'Membership Plans',
      description: 'Manage pricing and membership durations',
      color: 'green'
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notifications',
      description: 'Configure automated email reminders',
      color: 'orange'
    },
    {
      id: 'email',
      icon: Mail,
      title: 'Email Settings',
      description: 'Configure email sender information',
      color: 'blue'
    },
    {
      id: 'bug-reports',
      icon: Bug,
      title: 'Bug Reports',
      description: 'View and manage user-submitted issues',
      color: 'red',
      badge: 'NEW'
    },
    {
      id: 'system',
      icon: Settings,
      title: 'System Info',
      description: 'View system status and information',
      color: 'gray'
    }
  ];

  const colorClasses = {
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Global Message Banner */}
      {message && !activeModal && (
        <div className={`mb-4 p-3 md:p-4 rounded-xl border-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <p className={`text-sm md:text-base font-semibold ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.type === 'success' ? '' : ''} {message.text}
            </p>
            <button onClick={() => setMessage(null)} className="text-gray-600 text-lg">✕</button>
          </div>
        </div>
      )}

      {/* Settings Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsMenu.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveModal(item.id)}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:border-black transition-all text-left group relative"
          >
            {item.badge && (
              <span className="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                {item.badge}
              </span>
            )}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${colorClasses[item.color]} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <item.icon className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-black mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-black transition-colors flex-shrink-0" size={24} />
            </div>
          </button>
        ))}
      </div>

      {/* Modals */}
      {activeModal === 'plans' && <PlansModal closeModal={closeModal} message={message} setMessage={setMessage} />}
      {activeModal === 'notifications' && <NotificationsModal closeModal={closeModal} message={message} setMessage={setMessage} />}
      {activeModal === 'email' && <EmailModal closeModal={closeModal} message={message} setMessage={setMessage} />}
      {activeModal === 'bug-reports' && <BugReportsModal closeModal={closeModal} message={message} setMessage={setMessage} />}
      {activeModal === 'system' && <SystemModal closeModal={closeModal} />}
    </div>
  );
};

// Membership Plans Modal
const PlansModal = ({ closeModal, message, setMessage }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await api.get('/plans');
      
      if (data.success && data.plans) {
        setPlans(data.plans);
      } else {
        setMessage({ 
          type: 'error', 
          text: 'No plans found. Database may need to be seeded.' 
        });
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to load plans' 
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
      
      const data = await api.put(`/plans/${editingPlan._id}`, {
        displayName: editingPlan.displayName,
        price: editingPlan.price,
        duration: editingPlan.duration,
        description: editingPlan.description,
      });

      if (data.success) {
        setPlans(plans.map(p => p._id === editingPlan._id ? data.plan : p));
        setEditingPlan(null);
        setMessage({ 
          type: 'success', 
          text: 'Plan updated successfully!' 
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to update plan' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="Membership Plans" onClose={closeModal} icon={DollarSign}>
      {message && (
        <div className={`mb-4 p-3 rounded-lg border-2 ${
          message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm font-semibold ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.type === 'success' ? '' : ''} {message.text}
          </p>
        </div>
      )}

      {loading && plans.length === 0 ? (
        <div className="text-center py-8">
          <Loader className="animate-spin mx-auto mb-3 text-gray-400" size={40} />
          <p className="text-gray-600">Loading plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-600">No plans found</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {plans.map((plan) => (
            <div key={plan._id} className="border-2 border-gray-200 rounded-lg p-4">
              {editingPlan?._id === plan._id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Display Name</label>
                      <input
                        type="text"
                        value={editingPlan.displayName}
                        onChange={(e) => setEditingPlan({ ...editingPlan, displayName: e.target.value })}
                        className="w-full p-2 border-2 rounded focus:border-black focus:outline-none"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Price (₦)</label>
                      <input
                        type="number"
                        value={editingPlan.price}
                        onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                        className="w-full p-2 border-2 rounded focus:border-black focus:outline-none"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (days)</label>
                    <input
                      type="number"
                      value={editingPlan.duration}
                      onChange={(e) => setEditingPlan({ ...editingPlan, duration: Number(e.target.value) })}
                      className="w-full p-2 border-2 rounded focus:border-black focus:outline-none"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={editingPlan.description}
                      onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                      className="w-full p-2 border-2 rounded focus:border-black focus:outline-none"
                      rows={2}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePlanSave}
                      className="flex-1 bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
                      disabled={loading}
                    >
                      <Check className="inline mr-2" size={16} />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPlan(null)}
                      className="flex-1 bg-gray-500 text-white py-2 rounded font-semibold hover:bg-gray-600 disabled:opacity-50"
                      disabled={loading}
                    >
                      <X className="inline mr-2" size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-lg">{plan.displayName}</p>
                      <p className="text-xs text-gray-500">Code: {plan.name}</p>
                    </div>
                    <button
                      onClick={() => handlePlanEdit(plan)}
                      className="text-black hover:text-gray-700 p-2"
                      disabled={loading}
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                  <p className="text-3xl font-bold text-black mb-2">₦{plan.price.toLocaleString()}</p>
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
      )}

      <button
        onClick={closeModal}
        className="w-full mt-4 px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
      >
        Close
      </button>
    </ModalWrapper>
  );
};

// Bug Reports Modal

const BugReportsModal = ({ closeModal, message, setMessage }) => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Build query string
      const queryParams = new URLSearchParams();
      if (filterStatus !== 'all') {
        queryParams.append('status', filterStatus);
      }
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/bug-reports?${queryString}` : '/bug-reports';
      
      console.log(' Fetching bug reports from:', endpoint);
      
      // Api returns full axios response, so we need .data
      const response = await api.get(endpoint);
      const data = response.data; 
      
      console.log(' Bug reports response:', data);
      
      if (data.success) {
        setReports(data.reports || []);
        setStats(data.stats || {});
        console.log(' Loaded', data.reports?.length || 0, 'reports');
      } else {
        console.error(' API returned success: false');
        setMessage({ type: 'error', text: 'Failed to load bug reports' });
      }
    } catch (error) {
      console.error(' Error fetching bug reports:', error);
      console.error('Error response:', error.response?.data);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to load bug reports' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      console.log(' Updating report status:', reportId, '→', newStatus);
      
      // Get .data from response
      const response = await api.put(`/bug-reports/${reportId}`, { status: newStatus });
      const data = response.data;
      
      console.log(' Status update response:', data);
      
      if (data.success) {
        setReports(reports.map(r => r._id === reportId ? data.report : r));
        setMessage({ type: 'success', text: 'Status updated successfully' });
        setTimeout(() => setMessage(null), 2000);
        fetchReports(); // Refresh to update stats
      }
    } catch (error) {
      console.error(' Status update error:', error);
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      console.log(' Deleting report:', reportId);
      
      //Get .data from response
      const response = await api.delete(`/bug-reports/${reportId}`);
      const data = response.data;
      
      console.log(' Delete response:', data);
      
      if (data.success) {
        setReports(reports.filter(r => r._id !== reportId));
        setSelectedReport(null);
        setMessage({ type: 'success', text: 'Report deleted successfully' });
        setTimeout(() => setMessage(null), 2000);
        fetchReports(); // Refresh stats
      }
    } catch (error) {
      console.error(' Delete error:', error);
      setMessage({ type: 'error', text: 'Failed to delete report' });
    }
  };

  const filteredReports = reports.filter(report => 
    report.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch(status) {
      case 'new': return <AlertCircle size={18} className="text-yellow-600" />;
      case 'in_progress': return <Clock size={18} className="text-blue-600" />;
      case 'resolved': return <CheckCircle size={18} className="text-green-600" />;
      case 'closed': return <XCircle size={18} className="text-gray-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedReport) {
    return (
      <ModalWrapper title="Bug Report Details" onClose={() => setSelectedReport(null)} icon={Bug}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedReport(null)}
              className="flex items-center text-gray-600 hover:text-black"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to list
            </button>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedReport.status)}`}>
              {selectedReport.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm text-gray-600">Subject</p>
              <p className="font-semibold text-lg">{selectedReport.subject}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">From</p>
              <p className="font-semibold">{selectedReport.email}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedReport.email);
                  setMessage({ type: 'success', text: 'Email copied!' });
                  setTimeout(() => setMessage(null), 2000);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-1"
              >
                <Copy size={14} />
                Copy email
              </button>
            </div>
            <div>
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="font-semibold">
                {new Date(selectedReport.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <p className="whitespace-pre-wrap">{selectedReport.description}</p>
            </div>
          </div>

          {selectedReport.adminNotes && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Admin Notes</p>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="whitespace-pre-wrap">{selectedReport.adminNotes}</p>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Change Status</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleStatusUpdate(selectedReport._id, 'in_progress')}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold hover:bg-blue-200"
              >
                In Progress
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedReport._id, 'resolved')}
                className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold hover:bg-green-200"
              >
                Resolved
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedReport._id, 'closed')}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200"
              >
                Closed
              </button>
              <button
                onClick={() => handleDelete(selectedReport._id)}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-semibold hover:bg-red-200"
              >
                <Trash2 size={16} className="inline mr-2" />
                Delete
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <Mail size={16} />
              Contact user at <a href={`mailto:${selectedReport.email}`} className="font-semibold underline">{selectedReport.email}</a>
            </p>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper title="Bug Reports" onClose={closeModal} icon={Bug}>
      {message && (
        <div className={`mb-4 p-3 rounded-lg border-2 ${
          message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm font-semibold ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.type === 'success' ? '' : ''} {message.text}
          </p>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-800">{stats.new || 0}</p>
            <p className="text-xs text-yellow-600">New</p>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-800">{stats.inProgress || 0}</p>
            <p className="text-xs text-blue-600">In Progress</p>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-800">{stats.resolved || 0}</p>
            <p className="text-xs text-green-600">Resolved</p>
          </div>
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by subject or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-8">
          <Loader className="animate-spin mx-auto mb-3 text-gray-400" size={40} />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <Bug size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600">
            {reports.length === 0 ? 'No bug reports yet' : 'No reports match your search'}
          </p>
          {reports.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Users can submit reports from their Settings → Customer Service
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {filteredReports.map((report) => (
            <button
              key={report._id}
              onClick={() => setSelectedReport(report)}
              className="w-full text-left border-2 border-gray-200 rounded-lg p-3 hover:border-black transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(report.status)}
                    <p className="font-semibold text-black truncate">{report.subject}</p>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{report.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(report.status)}`}>
                  {report.status.replace('_', ' ')}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={closeModal}
        className="w-full mt-4 px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
      >
        Close
      </button>
    </ModalWrapper>
  );
};

// Notifications Modal
const NotificationsModal = ({ closeModal, message, setMessage }) => {
  const [settings, setSettings] = useState({
    emailReminders: true,
    reminderDaysBefore: 7,
    overdueReminders: true,
    adminAlerts: true,
    dailySummary: false,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setMessage({ type: 'success', text: 'Notification settings saved!' });
    setTimeout(() => closeModal(), 1500);
  };

  const notificationItems = [
    { key: 'emailReminders', title: 'Automated Email Reminders', desc: 'Send payment reminders automatically' },
    { key: 'overdueReminders', title: 'Overdue Payment Alerts', desc: 'Notify users when payments are overdue' },
    { key: 'adminAlerts', title: 'Admin Notifications', desc: 'Receive alerts for new registrations' },
    { key: 'dailySummary', title: 'Daily Summary Emails', desc: 'Get daily reports of gym activity' },
  ];

  return (
    <ModalWrapper title="Notification Settings" onClose={closeModal} icon={Bell}>
      {message && (
        <div className={`mb-4 p-3 rounded-lg border-2 ${
          message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm font-semibold ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.type === 'success' ? '' : ''} {message.text}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {notificationItems.map((item, index) => (
          <div
            key={item.key}
            className={`flex justify-between items-center py-3 ${
              index !== notificationItems.length - 1 ? 'border-b border-gray-200' : ''
            }`}
          >
            <div className="flex-1">
              <p className="font-semibold text-black">{item.title}</p>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings[item.key]}
                onChange={() => handleToggle(item.key)}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>
        ))}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
          <label className="block text-sm font-medium mb-2">
            Send reminders how many days before due date?
          </label>
          <select
            value={settings.reminderDaysBefore}
            onChange={(e) => setSettings({ ...settings, reminderDaysBefore: Number(e.target.value) })}
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

      <div className="flex gap-3 pt-6">
        <button
          onClick={handleSave}
          className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
        >
          <Save className="inline mr-2" size={16} />
          Save Settings
        </button>
        <button
          onClick={closeModal}
          className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </ModalWrapper>
  );
};

// Email Settings Modal
const EmailModal = ({ closeModal, message, setMessage }) => {
  const [config, setConfig] = useState({
    fromName: '1st Impression Fitness Center',
    fromEmail: 'gym@example.com',
    replyTo: 'support@1stimpression.com',
  });

  const handleSave = () => {
    setMessage({ type: 'success', text: 'Email configuration saved!' });
    setTimeout(() => closeModal(), 1500);
  };

  return (
    <ModalWrapper title="Email Configuration" onClose={closeModal} icon={Mail}>
      {message && (
        <div className={`mb-4 p-3 rounded-lg border-2 ${
          message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm font-semibold ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.type === 'success' ? '' : ''} {message.text}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">From Name</label>
          <input
            type="text"
            value={config.fromName}
            onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">From Email</label>
          <input
            type="email"
            value={config.fromEmail}
            onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Reply-To Email</label>
          <input
            type="email"
            value={config.replyTo}
            onChange={(e) => setConfig({ ...config, replyTo: e.target.value })}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-6">
        <button
          onClick={handleSave}
          className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
        >
          <Save className="inline mr-2" size={16} />
          Save Configuration
        </button>
        <button
          onClick={closeModal}
          className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </ModalWrapper>
  );
};

// System Info Modal
const SystemModal = ({ closeModal }) => {
  const systemInfo = [
    { label: 'System Version', value: 'v1.0.0' },
    { label: 'Email Scheduler', value: 'Active (9:00 AM daily)', color: 'text-green-600' },
    { label: 'Database Status', value: 'Connected', color: 'text-green-600' },
    { label: 'Last Backup', value: new Date().toLocaleDateString() },
  ];

  return (
    <ModalWrapper title="System Information" onClose={closeModal} icon={Settings}>
      <div className="grid grid-cols-2 gap-4">
        {systemInfo.map((item, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">{item.label}</p>
            <p className={`font-bold ${item.color || 'text-black'}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <button
        onClick={closeModal}
        className="w-full mt-6 px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition"
      >
        Close
      </button>
    </ModalWrapper>
  );
};

// Modal Wrapper Component
const ModalWrapper = ({ title, onClose, icon: Icon, children }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                    <Icon className="text-white" size={20} />
                  </div>
                )}
                <h2 className="text-xl font-bold text-black">{title}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default AdminSettingsPanel;
