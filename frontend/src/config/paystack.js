export const paystackConfig = {
  publicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_d3fea0d444a0ae51b813036cf818cce6aa571169',
  currency: 'NGN',
  channels: ['card', 'bank', 'ussd', 'bank_transfer'],
};

export const membershipPlans = {
  deluxe: {
    name: 'Deluxe Membership',
    amount: 1550000,
    duration: 30,
    description: 'Monthly subscription with full gym access',
  },
  BiMonthly: {
    name: 'Bi-Monthly Membership',
    amount: 4000000,
    duration: 90,
    description: '3 months access - Save ₦6,500',
  },
  Weekly: {
    name: 'Weekly Membership Access',
    amount: 650000,
    duration: 7,
    description: 'One week unlimited access',
  },
  WalkIn: {
    name: 'Walk-in Membership Access',
    amount: 500000,
    duration: 1,
    description: 'Single day pass - Try before you commit',
  },
};

export const formatAmount = (kobo) => {
  return (kobo / 100).toLocaleString();
};