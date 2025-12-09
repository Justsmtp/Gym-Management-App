// backend/utils/mailer.js
const { Resend } = require('resend');

/**
 * Initialize Resend client
 */
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured in environment variables');
  }
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
 * OPTIMIZED to avoid spam filters
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.token - Verification token
 * @param {string} params.name - User's name (optional)
 * @returns {Promise} - Resend response object
 */
const sendVerificationEmail = async ({ to, token, name }) => {
  try {
    console.log('📧 Sending verification email to:', to);

    const resend = getResendClient();
    const fromEmail = getSenderEmail();
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontend}/verify/${token}`;

    // SPAM-OPTIMIZED HTML EMAIL
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Verify Your Email - 1st Impression Fitness</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header -->
          <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">1st Impression Fitness</h1>
            <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 14px;">Welcome to Your Fitness Journey</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            
            <h2 style="color: #333333; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">
              Welcome${name ? `, ${name}` : ''}! 👋
            </h2>
            
            <p style="color: #666666; font-size: 16px; margin: 20px 0;">
              Thank you for joining <strong>1st Impression Fitness Center</strong>. We're excited to help you achieve your fitness goals!
            </p>
            
            <p style="color: #666666; font-size: 16px; margin: 20px 0;">
              To complete your registration and access your account, please verify your email address by clicking the button below:
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verifyUrl}" 
                 style="display: inline-block; 
                        padding: 16px 40px; 
                        background-color: #000000; 
                        color: #ffffff; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-size: 16px; 
                        font-weight: 600;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Verify My Email Address
              </a>
            </div>
            
            <!-- Alternative Link -->
            <div style="margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 6px; border-left: 4px solid #000000;">
              <p style="color: #666666; font-size: 13px; margin: 0 0 10px 0;">
                <strong>Button not working?</strong> Copy and paste this link into your browser:
              </p>
              <p style="color: #0066cc; font-size: 13px; word-break: break-all; margin: 0;">
                ${verifyUrl}
              </p>
            </div>
            
            <!-- Security Note -->
            <div style="margin: 30px 0; padding: 15px; background-color: #fff8e1; border-radius: 6px;">
              <p style="color: #856404; font-size: 13px; margin: 0;">
                <strong>🔒 Security Note:</strong> This verification link will expire in 24 hours. If you didn't create this account, please ignore this email or contact our support team.
              </p>
            </div>
            
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="color: #999999; font-size: 13px; margin: 0 0 10px 0;">
              You're receiving this email because you created an account at 1st Impression Fitness Center.
            </p>
            <p style="color: #999999; font-size: 13px; margin: 0;">
              © ${new Date().getFullYear()} 1st Impression Fitness Center. All rights reserved.
            </p>
            <p style="color: #cccccc; font-size: 11px; margin: 15px 0 0 0;">
              If you have any questions, please contact us at support@1stimpressionfitness.com
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // Plain text version - Important for spam filters!
    const text = `
Welcome${name ? `, ${name}` : ''}!

Thank you for joining 1st Impression Fitness Center.

Please verify your email address to complete your registration:
${verifyUrl}

If the link doesn't work, copy and paste it into your browser.

This verification link will expire in 24 hours.

If you didn't create this account, please ignore this email.

© ${new Date().getFullYear()} 1st Impression Fitness Center
Questions? Contact us at support@1stimpressionfitness.com
    `.trim();

    // Send email with spam-optimized settings
    const data = await resend.emails.send({
      from: `1st Impression Fitness <${fromEmail}>`,
      to: [to],
      subject: 'Please Verify Your Email Address', // Simple, clear subject
      text, // Plain text version - CRITICAL for spam filters
      html,
      // Add headers to improve deliverability
      headers: {
        'X-Entity-Ref-ID': token.substring(0, 12), // Add reference ID
      },
      tags: [
        {
          name: 'category',
          value: 'verification'
        }
      ]
    });

    console.log('✅ Verification email sent successfully');
    console.log('📧 Email ID:', data.id);
    console.log('📧 To:', to);
    console.log('📊 Check status: https://resend.com/emails/' + data.id);

    return data;

  } catch (error) {
    console.error('❌ Email sending error:', error);
    
    if (error.message?.includes('API key')) {
      console.error('💡 Invalid Resend API key');
    } else if (error.message?.includes('domain')) {
      console.error('💡 Domain not verified. Using onboarding@resend.dev for testing.');
    }

    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

/**
 * Sends password reset email
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.resetToken - Password reset token
 * @param {string} params.name - User's name (optional)
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
        <title>Reset Your Password - 1st Impression Fitness</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">1st Impression Fitness</h1>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Password Reset Request
            </h2>
            
            <p style="color: #666666; font-size: 16px; margin: 0 0 10px 0;">
              Hi${name ? ` ${name}` : ''},
            </p>
            
            <p style="color: #666666; font-size: 16px; margin: 20px 0;">
              We received a request to reset your password for your 1st Impression Fitness account.
            </p>
            
            <p style="color: #666666; font-size: 16px; margin: 20px 0;">
              Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; 
                        padding: 16px 40px; 
                        background-color: #000000; 
                        color: #ffffff; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-size: 16px;
                        font-weight: 600;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Reset My Password
              </a>
            </div>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 6px; border-left: 4px solid #000000;">
              <p style="color: #666666; font-size: 13px; margin: 0 0 10px 0;">
                <strong>Link not working?</strong> Copy and paste this URL:
              </p>
              <p style="color: #0066cc; font-size: 13px; word-break: break-all; margin: 0;">
                ${resetUrl}
              </p>
            </div>
            
            <div style="margin: 30px 0; padding: 15px; background-color: #fff3cd; border-radius: 6px;">
              <p style="color: #856404; font-size: 13px; margin: 0;">
                <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email or contact our support team immediately.
              </p>
            </div>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="color: #999999; font-size: 13px; margin: 0;">
              © ${new Date().getFullYear()} 1st Impression Fitness Center. All rights reserved.
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    const text = `
Hi${name ? ` ${name}` : ''},

We received a request to reset your password for your 1st Impression Fitness account.

Click here to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email.

© ${new Date().getFullYear()} 1st Impression Fitness Center
    `.trim();

    const data = await resend.emails.send({
      from: `1st Impression Fitness <${fromEmail}>`,
      to: [to],
      subject: 'Reset Your Password',
      text,
      html,
      tags: [
        {
          name: 'category',
          value: 'password-reset'
        }
      ]
    });

    console.log('✅ Password reset email sent');
    console.log('📧 Email ID:', data.id);

    return data;

  } catch (error) {
    console.error('❌ Password reset email error:', error);
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

    console.log('✅ Resend API key found');
    console.log('📧 Sender email:', fromEmail);

    if (testRecipient) {
      console.log('🧪 Sending test email to:', testRecipient);

      const data = await resend.emails.send({
        from: `1st Impression Fitness <${fromEmail}>`,
        to: [testRecipient],
        subject: '✅ Email Configuration Test',
        text: 'Your Resend email configuration is working correctly!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #28a745;">✅ Configuration Successful!</h2>
            <p>Your Resend email service is working correctly.</p>
            <p><strong>From:</strong> ${fromEmail}<br>
            <strong>To:</strong> ${testRecipient}<br>
            <strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `
      });

      console.log('✅ Test email sent:', data.id);
      return { success: true, emailId: data.id };
    }

    return { success: true, message: 'Resend API key is valid' };

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
