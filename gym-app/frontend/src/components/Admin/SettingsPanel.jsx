import React from 'react';

const SettingsPanel = () => {
  const plans = [
    {
      name: 'Walk-in Membership Access',
      price: '₦5,000/month',
      description: 'Access to gym floor and basic equipment',
    },
    {
      name: 'Weekly Membership Access',
      price: '₦6,500/month',
      description: 'Includes gym floor, equipment, and one class per week',
    },
    {
      name: 'Bi-Monthly Membership',
      price: '₦40,000/month',
      description: 'Full gym access, unlimited classes, and locker use',
    },
    {
      name: 'Deluxe Membership',
      price: '₦15,500/month',
      description: 'Full access to all gym areas, personal trainer, and priority booking',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-black mb-4">Notification Settings</h3>
        <div className="space-y-4">
          {[
            {
              title: 'Email Notifications',
              desc: 'Send email when payment is due',
              defaultChecked: true,
            },
            {
              title: 'Push Notifications',
              desc: 'Get push notifications for check-ins',
              defaultChecked: true,
            },
            {
              title: 'Renewal Reminders',
              desc: 'Remind members 3 days before due date',
              defaultChecked: true,
            },
          ].map((item, index) => (
            <div
              key={index}
              className={`flex justify-between items-center py-3 ${
                index !== 2 ? 'border-b border-gray-200' : ''
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
                  defaultChecked={item.defaultChecked}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Membership Plans */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-black mb-4">Membership Plans</h3>
        <div className="space-y-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold text-black">{plan.name}</p>
                <button className="text-sm text-black font-semibold hover:underline">
                  Edit
                </button>
              </div>
              <p className="text-2xl font-bold text-black mb-2">{plan.price}</p>
              <p className="text-sm text-gray-600">{plan.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
