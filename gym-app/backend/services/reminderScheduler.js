// backend/services/reminderScheduler.js
const cron = require('node-cron');
const { checkAndSendReminders } = require('./emailReminder');

let scheduledTask = null;

// Start the reminder scheduler
const startReminderScheduler = () => {
  if (scheduledTask) {
    console.log('⚠️ Reminder scheduler already running');
    return;
  }

  // Run every day at 9:00 AM
  // Cron format: minute hour day month weekday
  // '0 9 * * *' = At 9:00 AM every day
  
  scheduledTask = cron.schedule('0 9 * * *', async () => {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('🔔 SCHEDULED REMINDER CHECK - ' + new Date().toLocaleString());
    console.log('═══════════════════════════════════════════');
    
    try {
      await checkAndSendReminders();
      console.log('✅ Scheduled reminder check completed');
    } catch (error) {
      console.error('❌ Scheduled reminder check failed:', error.message);
    }
    
    console.log('═══════════════════════════════════════════');
    console.log('');
  }, {
    scheduled: true,
    timezone: "Africa/Lagos" // Change to your timezone
  });

  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   📧 Email Reminder Scheduler Started         ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log('⏰ Schedule: Daily at 9:00 AM (Africa/Lagos)');
  console.log('📅 Next run: ' + getNextRunTime());
  console.log('');
  console.log('Reminders will be sent:');
  console.log('  • 7 days before due date');
  console.log('  • 3 days before due date');
  console.log('  • 1 day before due date');
  console.log('  • On due date');
  console.log('  • Daily for first week when overdue');
  console.log('');
};

// Stop the scheduler
const stopReminderScheduler = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('🛑 Reminder scheduler stopped');
  }
};

// Get next run time
const getNextRunTime = () => {
  const now = new Date();
  const next = new Date();
  next.setHours(9, 0, 0, 0);
  
  // If 9 AM has passed today, schedule for tomorrow
  if (now.getHours() >= 9) {
    next.setDate(next.getDate() + 1);
  }
  
  return next.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Run reminder check immediately (for testing)
const runImmediately = async () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('🔔 MANUAL REMINDER CHECK - ' + new Date().toLocaleString());
  console.log('═══════════════════════════════════════════');
  
  try {
    const result = await checkAndSendReminders();
    console.log('✅ Manual reminder check completed');
    return result;
  } catch (error) {
    console.error('❌ Manual reminder check failed:', error.message);
    throw error;
  } finally {
    console.log('═══════════════════════════════════════════');
    console.log('');
  }
};

module.exports = {
  startReminderScheduler,
  stopReminderScheduler,
  runImmediately,
};