// backend/utils/mailer.js
const { Resend } = require('resend');

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found');
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(process.env.RESEND_API_KEY);
};

const getSenderEmail = () => {
  return process.env.SENDER_EMAIL || 'onboarding@resend.dev';
};

/**
 * Sends verification email - Optimized for Gmail delivery
 */
const sendVerificationEmail = async ({ to, token, name }) => {
  try {
    console.log('📧 Sending verification to:', to);

    const resend = getResendClient();
    const fromEmail = getSenderEmail();
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontend}/verify/${token}`;

    // Simpler, more professional email that Gmail trusts
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;padding:20px">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border-radius:8px">
                <tr>
                  <td style="background:#000;padding:30px;text-align:center">
                    <h1 style="color:#fff;margin:0;font-size:24px">1st Impression Fitness</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 30px">
                    <h2 style="color:#333;margin:0 0 20px;font-size:22px">Welcome${name ? `, ${name}` : ''}!</h2>
                    <p style="color:#666;font-size:16px;line-height:1.6;margin:0 0 20px">
                      Thank you for registering with 1st Impression Fitness Center.
                    </p>
                    <p style="color:#666;font-size:16px;line-height:1.6;margin:0 0 30px">
                      Please verify your email address to activate your account:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding:20px 0">
                          <a href="${verifyUrl}" 
                             style="display:inline-block;padding:14px 40px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-size:16px;font-weight:600">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color:#999;font-size:13px;margin:30px 0 0;padding-top:20px;border-top:1px solid #eee">
                      Or copy this link: <span style="color:#0066cc">${verifyUrl}</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8f8f8;padding:20px;text-align:center">
                    <p style="color:#999;font-size:12px;margin:0">
                      © ${new Date().getFullYear()} 1st Impression Fitness Center
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

    const text = `
Welcome${name ? `, ${name}` : ''}!

Thank you for registering with 1st Impression Fitness Center.

Verify your email: ${verifyUrl}

© ${new Date().getFullYear()} 1st Impression Fitness Center
    `.trim();

    // Send with minimal tags to avoid spam filters
    const data = await resend.emails.send({
      from: `1st Impression Fitness <${fromEmail}>`,
      to: [to],
      subject: 'Verify Your Email Address',
      text,
      html,
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'normal'
      }
    });

    console.log('✅ Verification email sent, ID:', data.id);
    console.log('📊 Check delivery: https://resend.com/emails/' + data.id);

    return data;

  } catch (error) {
    console.error('❌ Email error:', error.message);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

/**
 * Sends password reset email with 6-digit code
 */
const sendPasswordResetEmail = async ({ to, token, name }) => {
  try {
    console.log('📧 Sending password reset to:', to);

    const resend = getResendClient();
    const fromEmail = getSenderEmail();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;padding:20px">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border-radius:8px">
                <tr>
                  <td style="background:#000;padding:30px;text-align:center">
                    <h1 style="color:#fff;margin:0;font-size:24px">1st Impression Fitness</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 30px">
                    <h2 style="color:#333;margin:0 0 20px;font-size:22px">Password Reset</h2>
                    <p style="color:#666;font-size:16px;margin:0 0 10px">Hi${name ? ` ${name}` : ''},</p>
                    <p style="color:#666;font-size:16px;margin:20px 0">
                      Your password reset code is:
                    </p>
                    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;padding:30px;text-align:center;margin:30px 0">
                      <p style="color:#fff;font-size:48px;font-weight:700;letter-spacing:8px;margin:0;font-family:monospace">
                        ${token}
                      </p>
                    </div>
                    <p style="color:#999;font-size:13px;margin:20px 0 0">
                      This code expires in 15 minutes. If you didn't request this, ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8f8f8;padding:20px;text-align:center">
                    <p style="color:#999;font-size:12px;margin:0">
                      © ${new Date().getFullYear()} 1st Impression Fitness Center
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

    const text = `
Hi${name ? ` ${name}` : ''},

Your password reset code: ${token}

This code expires in 15 minutes.

© ${new Date().getFullYear()} 1st Impression Fitness Center
    `.trim();

    const data = await resend.emails.send({
      from: `1st Impression Fitness <${fromEmail}>`,
      to: [to],
      subject: 'Password Reset Code',
      text,
      html,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    });

    console.log('✅ Password reset sent, ID:', data.id);
    return data;

  } catch (error) {
    console.error('❌ Reset email error:', error.message);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

/**
 * Test email configuration
 */
const testEmailConfig = async (testRecipient) => {
  try {
    console.log('🧪 Testing Resend...');
    const resend = getResendClient();
    const fromEmail = getSenderEmail();
    console.log('✅ Config valid');

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
