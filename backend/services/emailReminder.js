// backend/services/emailReminder.js
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Create email transporter (reusing your existing mailer config)
const createTransporter = () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send reminder email
const sendReminderEmail = async ({ to, name, daysUntilDue, nextDueDate, membershipType, price }) => {
  try {
    const transporter = createTransporter();
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Determine email type and styling
    const isUrgent = daysUntilDue <= 2;
    const isDue = daysUntilDue <= 0;
    const urgencyColor = isDue ? '#dc2626' : isUrgent ? '#f59e0b' : '#3b82f6';
    const urgencyText = isDue ? '⚠️ PAYMENT OVERDUE' : isUrgent ? '⏰ URGENT: Payment Due Soon' : '📅 Payment Reminder';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background-color: #000; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .alert-banner { background-color: ${urgencyColor}; color: white; padding: 15px 20px; text-align: center; font-weight: bold; }
          .content { padding: 30px 20px; }
          .info-box { background-color: #f9f9f9; border-left: 4px solid ${urgencyColor}; padding: 15px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-label { color: #666; font-size: 14px; }
          .info-value { font-weight: bold; color: #000; }
          .button { display: inline-block; padding: 15px 30px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .button:hover { background-color: #333; }
          .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 20px 15px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏋️ 1st Impression Fitness Center</h1>
          </div>
          
          <div class="alert-banner">
            ${urgencyText}
          </div>
          
          <div class="content">
            <h2>Hello ${name}!</h2>
            
            ${isDue ? `
              <p style="color: #dc2626; font-weight: bold; font-size: 16px;">
                Your membership payment is now overdue. To continue enjoying our gym facilities, please renew your membership as soon as possible.
              </p>
            ` : isUrgent ? `
              <p style="color: #f59e0b; font-weight: bold;">
                Your membership expires in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}. Don't lose access to your fitness routine!
              </p>
            ` : `
              <p>
                This is a friendly reminder that your membership payment is coming up. 
                You have ${daysUntilDue} days until your next payment is due.
              </p>
            `}
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Membership Type:</span>
                <span class="info-value">${membershipType}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Next Due Date:</span>
                <span class="info-value">${new Date(nextDueDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Amount Due:</span>
                <span class="info-value" style="color: ${urgencyColor}; font-size: 18px;">₦${price.toLocaleString()}</span>
              </div>
              ${daysUntilDue <= 0 ? `
                <div class="info-row">
                  <span class="info-label" style="color: #dc2626;">Days Overdue:</span>
                  <span class="info-value" style="color: #dc2626;">${Math.abs(daysUntilDue)}</span>
                </div>
              ` : `
                <div class="info-row">
                  <span class="info-label">Days Remaining:</span>
                  <span class="info-value" style="color: ${urgencyColor};">${daysUntilDue}</span>
                </div>
              `}
            </div>
            
            <p style="margin-top: 25px;">
              <strong>What happens next?</strong>
            </p>
            <ul style="line-height: 2;">
              ${isDue ? `
                <li>Your gym access may be suspended</li>
                <li>Renew now to restore full access</li>
              ` : `
                <li>Renew online through your dashboard</li>
                <li>Visit the gym and pay at reception</li>
              `}
              <li>Contact us if you have any questions</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontend}" class="button" style="color: white;">
                ${isDue ? 'Renew Membership Now' : 'Make Payment'}
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 25px;">
              Need help? Contact us at <strong>${process.env.EMAIL_USER}</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated reminder from 1st Impression Fitness Center</p>
            <p>You're receiving this because you have an active membership with us</p>
            <p style="margin-top: 10px;">
              <a href="${frontend}" style="color: #666;">Visit Dashboard</a> | 
              <a href="mailto:${process.env.EMAIL_USER}" style="color: #666;">Contact Support</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = isDue 
      ? `⚠️ URGENT: Your Gym Membership Payment is Overdue`
      : isUrgent
      ? `⏰ Payment Due in ${daysUntilDue} Day${daysUntilDue !== 1 ? 's' : ''} - Action Required`
      : `📅 Upcoming Payment Reminder - ${daysUntilDue} Days`;

    const info = await transporter.sendMail({
      from: `"1st Impression Fitness" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Reminder email sent to ${to} (${daysUntilDue} days until due)`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error(`❌ Failed to send reminder to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Check and send reminders to all users
const checkAndSendReminders = async () => {
  try {
    console.log('🔍 Checking for upcoming payment due dates...');

    const now = new Date();
    
    // Find active users with upcoming or overdue payments
    const users = await User.find({
      isAdmin: false,
      status: { $in: ['active', 'expired'] },
      nextDueDate: { $exists: true },
    });

    console.log(`📊 Found ${users.length} users to check`);

    const reminders = {
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    for (const user of users) {
      try {
        const dueDate = new Date(user.nextDueDate);
        const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        // Send reminders at these intervals:
        // - 7 days before due (advance notice)
        // - 3 days before due (second reminder)
        // - 1 day before due (urgent)
        // - 0 days (due today)
        // - Overdue (every day for first 7 days)

        const shouldSendReminder = 
          daysUntilDue === 7 ||   // 7 days before
          daysUntilDue === 3 ||   // 3 days before
          daysUntilDue === 1 ||   // 1 day before
          daysUntilDue === 0 ||   // Due today
          (daysUntilDue < 0 && daysUntilDue >= -7); // Overdue (first week)

        if (shouldSendReminder) {
          console.log(`📧 Sending reminder to ${user.name} (${daysUntilDue} days)`);

          const result = await sendReminderEmail({
            to: user.email,
            name: user.name,
            daysUntilDue,
            nextDueDate: user.nextDueDate,
            membershipType: user.membershipType,
            price: user.membershipPrice || 15500,
          });

          if (result.success) {
            reminders.sent++;
            
            // Update user status if overdue
            if (daysUntilDue < 0 && user.status === 'active') {
              user.status = 'expired';
              user.paymentStatus = 'due';
              await user.save();
              console.log(`⚠️ User ${user.name} marked as expired`);
            }
          } else {
            reminders.failed++;
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } else {
          reminders.skipped++;
        }

      } catch (error) {
        console.error(`Error processing user ${user.name}:`, error.message);
        reminders.failed++;
      }
    }

    console.log('');
    console.log('📊 Reminder Summary:');
    console.log(`   ✅ Sent: ${reminders.sent}`);
    console.log(`   ❌ Failed: ${reminders.failed}`);
    console.log(`   ⏭️  Skipped: ${reminders.skipped}`);
    console.log('');

    return reminders;

  } catch (error) {
    console.error('❌ Error in checkAndSendReminders:', error.message);
    throw error;
  }
};

// Manual reminder for specific user
const sendManualReminder = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.nextDueDate) {
      throw new Error('User has no due date set');
    }

    const now = new Date();
    const dueDate = new Date(user.nextDueDate);
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    return await sendReminderEmail({
      to: user.email,
      name: user.name,
      daysUntilDue,
      nextDueDate: user.nextDueDate,
      membershipType: user.membershipType,
      price: user.membershipPrice || 15500,
    });

  } catch (error) {
    console.error('Manual reminder error:', error.message);
    throw error;
  }
};

module.exports = {
  checkAndSendReminders,
  sendManualReminder,
  sendReminderEmail,
};