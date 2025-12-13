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
 * Sends password reset email with 6-digit code
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.token - 6-digit reset code (NOT resetToken!)
 * @param {string} params.name - User's name
 */
const sendPasswordResetEmail = async ({ to, token, name }) => {
  try {
    console.log('📧 Sending password reset email to:', to);
    console.log('🔑 Reset code:', token);

    const resend = getResendClient();
    const fromEmail = getSenderEmail();

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
          
          <!-- Header -->
          <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🔐 Password Reset</h1>
            <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 14px;">1st Impression Fitness Center</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Password Reset Request
            </h2>
            
            <p style="color: #666666; font-size: 16px; margin: 0 0 10px 0;">
              Hi${name ? ` ${name}` : ''},
            </p>
            
            <p style="color: #666666; font-size: 16px; margin: 20px 0;">
              We received a request to reset your password. Use the code below to reset your password:
            </p>
            
            <!-- Reset Code Box -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        border-radius: 12px; 
                        padding: 30px; 
                        text-align: center; 
                        margin: 30px 0;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 2px;">
                Your Reset Code
              </p>
              <p style="color: #ffffff; 
                        font-size: 48px; 
                        font-weight: 700; 
                        letter-spacing: 8px; 
                        margin: 0; 
                        font-family: 'Courier New', monospace;">
                ${token}
              </p>
              <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 15px 0 0 0;">
                Enter this code on the password reset page
              </p>
            </div>
            
            <!-- Warning Box -->
            <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
              <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.6;">
                <strong>⏰ Important:</strong> This code will expire in <strong>15 minutes</strong> for security reasons.
              </p>
            </div>
            
            <!-- Security Tips -->
            <div style="margin: 30px 0; padding: 20px; background-color: #f0f0f0; border-radius: 6px;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                <strong>🛡️ Security Tips:</strong>
              </p>
              <ul style="color: #666666; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>Never share this code with anyone</li>
                <li>We will never ask for your password via email</li>
                <li>This code can only be used once</li>
              </ul>
            </div>
            
            <p style="color: #666666; font-size: 14px; margin: 30px 0 0 0;">
              If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="color: #999999; font-size: 13px; margin: 0;">
              © ${new Date().getFullYear()} 1st Impression Fitness Center. All rights reserved.
            </p>
            <p style="color: #cccccc; font-size: 11px; margin: 15px 0 0 0;">
              Questions? Contact us at support@1stimpressionfitness.com
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    const text = `
Hi${name ? ` ${name}` : ''},

We received a request to reset your password for your 1st Impression Fitness account.

Your password reset code is: ${token}

This code will expire in 15 minutes for security reasons.

If you didn't request this password reset, please ignore this email.

Security Tips:
- Never share this code with anyone
- We will never ask for your password via email
- This code can only be used once

© ${new Date().getFullYear()} 1st Impression Fitness Center
Questions? Contact us at support@1stimpressionfitness.com
    `.trim();

    const data = await resend.emails.send({
      from: `1st Impression Fitness <${fromEmail}>`,
      to: [to],
      subject: 'Password Reset Code - 1st Impression Fitness',
      text,
      html,
      tags: [
        {
          name: 'category',
          value: 'password-reset'
        }
      ]
    });

    console.log('✅ Password reset email sent successfully');
    console.log('📧 Email ID:', data.id);

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
