// backend/services/membershipScheduler.js
const cron = require('node-cron');
const { runBulkMembershipCheck } = require('../utils/membershipChecker');

let schedulerStarted = false;

/**
 * Start the membership status checker
 * Runs every hour to check and update expired memberships
 */
const startMembershipScheduler = () => {
  if (schedulerStarted) {
    console.log('⚠️ Membership scheduler already running');
    return;
  }

  console.log('🔄 Starting membership status scheduler...');

  // Run every hour (at minute 0)
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running scheduled membership status check...');
    const result = await runBulkMembershipCheck();
    console.log('📊 Membership check result:', result);
  });

  // Also run daily at midnight for a full check
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running daily full membership status check...');
    const result = await runBulkMembershipCheck();
    console.log('📊 Daily check result:', result);
  });

  // Run immediately on startup
  setTimeout(async () => {
    console.log('🔄 Running initial membership status check...');
    await runBulkMembershipCheck();
  }, 5000); // Wait 5 seconds after server starts

  schedulerStarted = true;
  console.log('✅ Membership status scheduler started');
  console.log('   - Hourly checks at minute 0');
  console.log('   - Daily full check at midnight');
};

/**
 * Run membership check immediately (for manual triggers)
 */
const runImmediateCheck = async () => {
  console.log('🔄 Running immediate membership status check...');
  return await runBulkMembershipCheck();
};

module.exports = {
  startMembershipScheduler,
  runImmediateCheck
};
