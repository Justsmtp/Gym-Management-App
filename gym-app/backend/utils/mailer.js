// backend/utils/mailer.js
const { Resend } = require('resend');

/**
 * Initialize Resend client
 */
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment');
    throw new Error('RESEND_API_KEY is not configured in environment variables');
  }
  console.log('✅ Resend client initialized');
  return new Resend(process.env.RESEND_API_KEY);
};

/**
 * Get the sender email
 */
const getSenderEmail = () => {
  return process.env.SENDER_EMAIL || 'onboarding@resend.dev';
};

/**
 * Sends verification email to new users
 */
const sendVerificationEmail = async ({ to, token, name }) => {
  try {
    console.log('📧 Sending verification email to:', to);

    const resend = getResendClient();
    const fromEmail = getSenderEmail();
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontend}/verify/${token}`;

    console.log('📧 From:', fromEmail);
    console.log('📧 Verify URL:', verifyUrl);

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">1st Impression Fitness</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #333333; margin: 0 0 20px 0;">Welcome${name ? `, ${name}` : ''}! 👋</h2>
            <p style="color: #666666; font-size: 16px; margin: 20px 0;">
              Thank you for joining 1st Impression Fitness Center.
            </p>
            <p style="color: #666666; font-size: 16px; margin: 20px 0;">
              Please verify your email address by clicking the button below:
            </p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verifyUrl}" 
                 style="display: inline-block; padding: 16px 40px; background-color: #000000; 
                        color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                Verify My Email Address
              </a>
            </div>
            <div style="margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 6px;">
              <p style="color: #666666; font-size: 13px; margin: 0 0 10px 0;">
                <strong>Button not working?</strong> Copy and paste this link:
              </p>
              <p style="color: #0066cc; font-size: 13px; word-break: break-all; margin: 0;">
                ${verifyUrl}
              </p>
            </div>
          </div>
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center;">
            <p style="color: #999999; font-size: 13px; margin: 0;">
              © ${new Date().getFullYear()} 1st Impression Fitness Center
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome${name ? `, ${name}` : ''}!

Thank you for joining 1st Impression Fitness Center.

Please verify your email address:
${verifyUrl}

If you didn't create this account, please ignore this email.

© ${new Date().getFullYear()} 1st Impression Fitness Center
    `.trim();

    const data = await resend.emails.send({
      from: `1st Impression Fitness <${fromEmail}>`,
      to: [to],
      subject: 'Please Verify Your Email Address',
      text,
      html,
    });

    console.log('✅ Email sent successfully');
    console.log('📧 Email ID:', data.id);

    return data;

  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

/**
 * Sends password reset email
 */
const sendPasswordResetEmail = async ({ to, resetToken, name }) => {
  try {
    console.log('📧 Sending password reset email to:', to);

    const resend = getResendClient();
    const fromEmail = getSenderEmail();
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontend}/reset-password/${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">1st Impression Fitness</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #333333; margin: 0 0 20px 0;">Password Reset Request</h2>
            <p style="color: #666666; font-size: 16px;">Hi${name ? ` ${name}` : ''},</p>
            <p style="color: #666666; font-size: 16px; margin: 20px 0;">
              Click the button below to reset your password:
            </p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; padding: 16px 40px; background-color: #000000; 
                        color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                Reset My Password
              </a>
            </div>
            <p style="color: #999999; font-size: 13px;">
              This link will expire in 1 hour. If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi${name ? ` ${name}` : ''},

Click here to reset your password:
${resetUrl}

This link will expire in 1 hour.

© ${new Date().getFullYear()} 1st Impression Fitness Center
    `.trim();

    const data = await resend.emails.send({
      from: `1st Impression Fitness <${fromEmail}>`,
      to: [to],
      subject: 'Reset Your Password',
      text,
      html,
    });

    console.log('✅ Password reset email sent');
    return data;

  } catch (error) {
    console.error('❌ Password reset email error:', error.message);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

/**
 * Test email configuration
 */
const testEmailConfig = async (testRecipient) => {
  try {
    console.log('🧪 Testing Resend configuration...');
    const resend = getResendClient();
    const fromEmail = getSenderEmail();
    console.log('✅ Configuration valid');

    if (testRecipient) {
      const data = await resend.emails.send({
        from: `1st Impression Fitness <${fromEmail}>`,
        to: [testRecipient],
        subject: 'Test Email',
        text: 'Test successful',
        html: '<p>Test successful</p>'
      });
      return { success: true, emailId: data.id };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  testEmailConfig,
  getResendClient
};
