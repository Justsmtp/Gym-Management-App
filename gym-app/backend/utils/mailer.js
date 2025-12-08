// backend/utils/mailer.js
const nodemailer = require('nodemailer');

/**
 * Creates email transporter with proper error handling
 * Works with Gmail App Passwords and generic SMTP
 */
const createTransporter = () => {
  try {
    // Check if we have required email credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ EMAIL_USER or EMAIL_PASS not configured');
      throw new Error('Email configuration missing');
    }

    console.log('📧 Creating email transporter...');
    console.log('📧 Email User:', process.env.EMAIL_USER);
    console.log('📧 Password length:', process.env.EMAIL_PASS?.length || 0);

    // Option 1: Custom SMTP server (if EMAIL_HOST is provided)
    if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
      console.log('📧 Using custom SMTP server:', process.env.EMAIL_HOST);
      
      return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false // Accept self-signed certificates (for development)
        }
      });
    }

    // Option 2: Gmail (default) - Works with App Passwords
    console.log('📧 Using Gmail SMTP service');
    
    return nodemailer.createTransporter({
      service: 'gmail',
      host: 'smtp.gmail.com', // Explicitly set host
      port: 587, // Use port 587 for TLS
      secure: false, // Use TLS (not SSL)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.trim(), // Trim any whitespace
      },
      tls: {
        rejectUnauthorized: false
      },
      // Add timeout settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

  } catch (error) {
    console.error('❌ Error creating transporter:', error.message);
    throw error;
  }
};

/**
 * Sends verification email to new users
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.token - Verification token
 * @param {string} params.name - User's name (optional)
 * @returns {Promise} - Nodemailer info object
 */
const sendVerificationEmail = async ({ to, token, name }) => {
  try {
    console.log('📧 Attempting to send verification email to:', to);

    // Create transporter
    const transporter = createTransporter();

    // Verify transporter configuration
    console.log('📧 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Prepare email content
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontend}/verify/${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #000000; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">1st Impression Fitness</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">
                      Welcome${name ? `, ${name}` : ''}! 🎉
                    </h2>
                    
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Thank you for registering at <strong>1st Impression Fitness Center</strong>. 
                      We're excited to have you join our community!
                    </p>
                    
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                      Please verify your email address to activate your account and get started:
                    </p>
                    
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${verifyUrl}" 
                             style="display: inline-block; 
                                    padding: 14px 40px; 
                                    background-color: #000000; 
                                    color: #ffffff; 
                                    text-decoration: none; 
                                    border-radius: 6px; 
                                    font-size: 16px; 
                                    font-weight: bold;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Alternative Link -->
                    <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">
                      <strong>Button not working?</strong> Copy and paste this link into your browser:
                    </p>
                    <p style="color: #0066cc; font-size: 13px; word-break: break-all; margin: 10px 0 0 0;">
                      ${verifyUrl}
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center;">
                    <p style="color: #999999; font-size: 12px; margin: 0; line-height: 1.6;">
                      If you didn't create this account, please ignore this email.
                    </p>
                    <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                      © ${new Date().getFullYear()} 1st Impression Fitness Center. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Plain text version (fallback)
    const text = `
Welcome${name ? `, ${name}` : ''}!

Thank you for registering at 1st Impression Fitness Center.

Please verify your email address by clicking this link:
${verifyUrl}

If the link doesn't work, copy and paste it into your browser.

If you didn't create this account, please ignore this email.

© ${new Date().getFullYear()} 1st Impression Fitness Center
    `.trim();

    // Send email
    console.log('📧 Sending email...');
    const info = await transporter.sendMail({
      from: `"1st Impression Fitness" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Verify Your Email - 1st Impression Fitness',
      text, // Plain text version
      html, // HTML version
    });

    console.log('✅ Email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Response:', info.response);

    return info;

  } catch (error) {
    console.error('❌ Email sending error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });

    // Re-throw with more context
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

    const transporter = createTransporter();
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontend}/reset-password/${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="background-color: #000000; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0;">1st Impression Fitness</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0;">
                      Password Reset Request
                    </h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                      Hi${name ? ` ${name}` : ''},
                    </p>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                      We received a request to reset your password. Click the button below to create a new password:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${resetUrl}" 
                             style="display: inline-block; 
                                    padding: 14px 40px; 
                                    background-color: #000000; 
                                    color: #ffffff; 
                                    text-decoration: none; 
                                    border-radius: 6px; 
                                    font-weight: bold;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #999999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                      This link will expire in 1 hour. If you didn't request this, please ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"1st Impression Fitness" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Reset Your Password - 1st Impression Fitness',
      html,
    });

    console.log('✅ Password reset email sent');
    return info;

  } catch (error) {
    console.error('❌ Password reset email error:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

/**
 * Test email configuration
 * Sends a test email to verify setup
 */
const testEmailConfig = async () => {
  try {
    console.log('🧪 Testing email configuration...');
    
    const transporter = createTransporter();
    await transporter.verify();
    
    console.log('✅ Email configuration is valid');
    return { success: true, message: 'Email configuration is valid' };
    
  } catch (error) {
    console.error('❌ Email configuration test failed:', error);
    return { 
      success: false, 
      message: error.message,
      hint: 'Check EMAIL_USER and EMAIL_PASS environment variables'
    };
  }
};

module.exports = { 
  sendVerificationEmail,
  sendPasswordResetEmail,
  testEmailConfig,
  createTransporter
};
