// backend/utils/mailer.js
const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // fallback to Gmail (requires app password for production)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendVerificationEmail = async ({ to, token, name }) => {
  const transporter = createTransporter();
  const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyUrl = `${frontend}/verify/${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.5;">
      <h2>Welcome${name ? `, ${name}` : ''}!</h2>
      <p>Thanks for registering at 1st Impression Fitness Center. Please verify your email to activate your account.</p>
      <p>
        <a href="${verifyUrl}" style="display:inline-block;padding:10px 18px;background:#000;color:#fff;border-radius:6px;text-decoration:none;">
          Verify Email
        </a>
      </p>
      <p style="font-size:12px;color:#666">If clicking doesn't work, paste the link into your browser:</p>
      <p style="font-size:12px;color:#666">${verifyUrl}</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"1st Impression Fitness" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your email for 1st Impression Fitness',
    html,
  });

  return info;
};

module.exports = { sendVerificationEmail };
