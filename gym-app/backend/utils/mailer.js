// backend/utils/mailer.js
const { Resend } = require(‘resend’);

/**

- Initialize Resend client with validation
  */
  const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
  console.error(‘❌ RESEND_API_KEY not found in environment variables’);
  console.error(‘💡 Add RESEND_API_KEY to your .env file’);
  throw new Error(‘RESEND_API_KEY is not configured’);
  }

const apiKey = process.env.RESEND_API_KEY.trim();

// Validate API key format
if (!apiKey.startsWith(‘re_’)) {
console.error(‘❌ Invalid RESEND_API_KEY format. Should start with “re_”’);
throw new Error(‘Invalid RESEND_API_KEY format’);
}

console.log(‘✅ Resend client initialized’);
console.log(‘📧 API Key:’, apiKey.substring(0, 10) + ‘…’ + apiKey.substring(apiKey.length - 4));

return new Resend(apiKey);
};

/**

- Get sender email with validation
  */
  const getSenderEmail = () => {
  const senderEmail = process.env.SENDER_EMAIL || ‘onboarding@resend.dev’;
  console.log(‘📧 Sender email:’, senderEmail);
  return senderEmail;
  };

/**

- Enhanced error logging
  */
  const logEmailError = (error, context) => {
  console.error(‘━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━’);
  console.error(‘❌ EMAIL ERROR:’, context);
  console.error(‘━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━’);
  console.error(‘Error Type:’, error.name);
  console.error(‘Error Message:’, error.message);

if (error.response) {
console.error(‘Response Status:’, error.response.status);
console.error(‘Response Data:’, JSON.stringify(error.response.data, null, 2));
}

if (error.statusCode) {
console.error(‘Status Code:’, error.statusCode);
}

console.error(‘Full Error:’, error);
console.error(‘━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━’);

// Provide helpful suggestions
if (error.message?.includes(‘API key’)) {
console.error(‘💡 Check your RESEND_API_KEY in .env file’);
console.error(‘💡 Get your API key from: https://resend.com/api-keys’);
} else if (error.message?.includes(‘domain’)) {
console.error(‘💡 If using custom domain, verify it at: https://resend.com/domains’);
console.error(‘💡 Or use onboarding@resend.dev for testing’);
} else if (error.message?.includes(‘rate limit’) || error.statusCode === 429) {
console.error(‘💡 Rate limit reached. Free tier: 100 emails/day, 1 email/second’);
console.error(‘💡 Wait a moment or upgrade plan at: https://resend.com/pricing’);
} else if (error.statusCode === 403) {
console.error(‘💡 Access denied. Check API key permissions’);
} else if (error.statusCode === 422) {
console.error(‘💡 Invalid request data. Check email format and content’);
}
};

/**

- Sends verification email to new users
  */
  const sendVerificationEmail = async ({ to, token, name }) => {
  const startTime = Date.now();

try {
console.log(’\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━’);
console.log(‘📧 SENDING VERIFICATION EMAIL’);
console.log(‘━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━’);
console.log(‘To:’, to);
console.log(‘Name:’, name);
console.log(‘Token:’, token.substring(0, 12) + ‘…’);
console.log(‘Timestamp:’, new Date().toISOString());

```
const resend = getResendClient();
const fromEmail = getSenderEmail();
const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
const verifyUrl = `${frontend}/verify/${token}`;

console.log('🔗 Verify URL:', verifyUrl);

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
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">✉️ Email Verification</h1>
        <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 14px;">1st Impression Fitness Center</p>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
          Welcome${name ? `, ${name}` : ''}! 👋
        </h2>
        <p style="color: #666666; font-size: 16px; margin: 20px 0;">
          Thank you for joining <strong>1st Impression Fitness Center</strong>. We're excited to have you!
        </p>
        <p style="color: #666666; font-size: 16px; margin: 20px 0;">
          Please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${verifyUrl}" 
             style="display: inline-block; padding: 16px 40px; background-color: #000000; 
                    color: #ffffff; text-decoration: none; border-radius: 6px; 
                    font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Verify My Email Address
          </a>
        </div>
        <div style="margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 6px; border-left: 4px solid #000000;">
          <p style="color: #666666; font-size: 13px; margin: 0 0 10px 0;">
            <strong>Button not working?</strong> Copy and paste this link:
          </p>
          <p style="color: #0066cc; font-size: 13px; word-break: break-all; margin: 0;">
            ${verifyUrl}
          </p>
        </div>
        <div style="margin: 30px 0; padding: 20px; background-color: #fff8e1; border-radius: 6px; border-left: 4px solid #ffc107;">
          <p style="color: #856404; font-size: 13px; margin: 0;">
            <strong>⏰ Note:</strong> This verification link will expire in 24 hours.
          </p>
        </div>
        <p style="color: #666666; font-size: 14px; margin: 30px 0 0 0;">
          If you didn't create this account, please ignore this email.
        </p>
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
```

Welcome${name ? `, ${name}` : ‘’}!

Thank you for joining 1st Impression Fitness Center.

Please verify your email address:
${verifyUrl}

This verification link will expire in 24 hours.

If you didn’t create this account, please ignore this email.

© ${new Date().getFullYear()} 1st Impression Fitness Center
`.trim();

```
console.log('📤 Sending to Resend API...');

const data = await resend.emails.send({
  from: `1st Impression Fitness <${fromEmail}>`,
  to: [to],
  subject: 'Verify Your Email - 1st Impression Fitness',
  text,
  html,
  tags: [{ name: 'category', value: 'verification' }]
});

const duration = Date.now() - startTime;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ VERIFICATION EMAIL SENT SUCCESSFULLY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Email ID:', data.id);
console.log('Duration:', duration + 'ms');
console.log('Check status:', `https://resend.com/emails/${data.id}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

return data;
```

} catch (error) {
logEmailError(error, ‘Verification Email’);
throw error;
}
};

/**

- Sends password reset email with 6-digit code
  */
  const sendPasswordResetEmail = async ({ to, token, name }) => {
  const startTime = Date.now();

try {
console.log(’\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━’);
console.log(‘🔑 SENDING PASSWORD RESET EMAIL’);
console.log(‘━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━’);
console.log(‘To:’, to);
console.log(‘Name:’, name);
console.log(‘Reset Code:’, token);
console.log(‘Timestamp:’, new Date().toISOString());

```
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
      <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🔐 Password Reset</h1>
        <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 14px;">1st Impression Fitness Center</p>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
          Password Reset Request
        </h2>
        <p style="color: #666666; font-size: 16px; margin: 0 0 10px 0;">
          Hi${name ? ` ${name}` : ''},
        </p>
        <p style="color: #666666; font-size: 16px; margin: 20px 0;">
          We received a request to reset your password. Use the code below:
        </p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 15px 0; 
                    text-transform: uppercase; letter-spacing: 2px;">Your Reset Code</p>
          <p style="color: #ffffff; font-size: 48px; font-weight: 700; letter-spacing: 8px; 
                    margin: 0; font-family: 'Courier New', monospace;">${token}</p>
        </div>
        <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; 
                    border-radius: 6px; border-left: 4px solid #ffc107;">
          <p style="color: #856404; font-size: 14px; margin: 0;">
            <strong>⏰ Important:</strong> This code expires in <strong>15 minutes</strong>.
          </p>
        </div>
        <div style="margin: 30px 0; padding: 20px; background-color: #f0f0f0; border-radius: 6px;">
          <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;"><strong>🛡️ Security Tips:</strong></p>
          <ul style="color: #666666; font-size: 14px; margin: 0; padding-left: 20px;">
            <li>Never share this code</li>
            <li>We never ask for passwords via email</li>
            <li>This code can only be used once</li>
          </ul>
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
```

Hi${name ? ` ${name}` : ‘’},

Your password reset code is: ${token}

This code expires in 15 minutes.

If you didn’t request this, please ignore this email.

© ${new Date().getFullYear()} 1st Impression Fitness Center
`.trim();

```
console.log('📤 Sending to Resend API...');

const data = await resend.emails.send({
  from: `1st Impression Fitness <${fromEmail}>`,
  to: [to],
  subject: 'Password Reset Code - 1st Impression Fitness',
  text,
  html,
  tags: [{ name: 'category', value: 'password-reset' }]
});

const duration = Date.now() - startTime;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ PASSWORD RESET EMAIL SENT SUCCESSFULLY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Email ID:', data.id);
console.log('Duration:', duration + 'ms');
console.log('Check status:', `https://resend.com/emails/${data.id}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

return data;
```

} catch (error) {
logEmailError(error, ‘Password Reset Email’);
throw error;
}
};

/**

- Test email configuration
  */
  const testEmailConfig = async (testRecipient) => {
  try {
  console.log(’\n🧪 Testing Resend configuration…’);
  const resend = getResendClient();
  const fromEmail = getSenderEmail();
  
  console.log(‘✅ Configuration valid’);
  
  if (testRecipient) {
  console.log(‘📤 Sending test email…’);
  const data = await resend.emails.send({
  from: `1st Impression Fitness <${fromEmail}>`,
  to: [testRecipient],
  subject: ‘✅ Email Configuration Test’,
  text: ‘Your Resend email configuration is working correctly!’,
  html: `<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;"> <h2 style="color: #28a745;">✅ Configuration Successful!</h2> <p>Your Resend email service is working correctly.</p> <p><strong>From:</strong> ${fromEmail}<br> <strong>To:</strong> ${testRecipient}<br> <strong>Time:</strong> ${new Date().toLocaleString()}</p> <p style="color: #666; font-size: 12px; margin-top: 30px;"> This is a test email from 1st Impression Fitness Center </p> </div>`
  });
  
  console.log(‘✅ Test email sent successfully’);
  console.log(‘📧 Email ID:’, data.id);
  return { success: true, emailId: data.id };
  }
  
  return { success: true, message: ‘Configuration is valid’ };
  } catch (error) {
  logEmailError(error, ‘Test Email’);
  return { success: false, error: error.message };
  }
  };

module.exports = {
sendVerificationEmail,
sendPasswordResetEmail,
testEmailConfig,
getResendClient
};