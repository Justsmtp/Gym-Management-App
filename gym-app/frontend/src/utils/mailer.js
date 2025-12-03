const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async ({ to, token, name }) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: '1st Impression Gym - Verify Your Email',
    html: `
      <h2>Hello ${name},</h2>
      <p>Thank you for registering with 1st Impression Gym!</p>
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't register, please ignore this email.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };