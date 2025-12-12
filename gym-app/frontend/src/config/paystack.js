// frontend/src/config/paystack.js

export const paystackConfig = {
  publicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_d3fea0d444a0ae51b813036cf818cce6aa571169',
  currency: 'NGN',
  channels: ['card', 'bank', 'ussd', 'bank_transfer'],
};

/**
 * CRITICAL: These 'name' values MUST match the backend Payment model enum EXACTLY:
 * Backend enum: ['Walk-in', 'Weekly', 'Deluxe', 'Bi-Monthly']
 * 
 * Use 'displayName' for frontend UI display
 */
export const membershipPlans = {
  deluxe: {
    name: 'Deluxe',                      // ✅ Backend enum value
    displayName: 'Deluxe Membership',    // For display only
    amount: 1550000,                     // ₦15,500 in kobo
    duration: 30,                        // days
    description: 'Monthly subscription with full gym access',
  },
  BiMonthly: {
    name: 'Bi-Monthly',                  // ✅ Backend enum value
    displayName: 'Bi-Monthly Membership',// For display only
    amount: 4000000,                     // ₦40,000 in kobo
    duration: 90,                        // days
    description: '3 months access - Save ₦6,500',
  },
  Weekly: {
    name: 'Weekly',                      // ✅ Backend enum value
    displayName: 'Weekly Membership Access', // For display only
    amount: 650000,                      // ₦6,500 in kobo
    duration: 7,                         // days
    description: 'One week unlimited access',
  },
  WalkIn: {
    name: 'Walk-in',                     // ✅ Backend enum value
    displayName: 'Walk-in Membership Access', // For display only
    amount: 500000,                      // ₦5,000 in kobo
    duration: 1,                         // days
    description: 'Single day pass - Try before you commit',
  },
};

export const formatAmount = (kobo) => {
  return (kobo / 100).toLocaleString();
};
