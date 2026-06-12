const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Initialize transporter
let transporter;

const setupTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 2525;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    logger.warn('Nodemailer SMTP user or password is missing. Mailer will run in MOCK LOG mode.');
    transporter = null;
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    auth: { user, pass }
  });

  return transporter;
};

/**
 * Core send mail utility
 */
const sendMail = async ({ to, subject, html, text }) => {
  const activeTransporter = setupTransporter();
  const from = process.env.SMTP_FROM || 'noreply@enterprise-ems.com';

  if (!activeTransporter) {
    logger.info(`[MOCK EMAIL SENT]
    To: ${to}
    From: ${from}
    Subject: ${subject}
    Text: ${text || 'HTML Content (rendered in browser)'}
    `);
    return { mock: true };
  }

  try {
    const info = await activeTransporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    });
    logger.info(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error('Nodemailer failed to transmit email', err);
    // Silent fail in development to prevent API crashes, throw in production
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    return { error: err.message };
  }
};

// --- Specialized Templates ---

const sendWelcomeEmail = async (email, employeeName, tempPassword) => {
  return await sendMail({
    to: email,
    subject: 'Welcome to Enterprise EMS!',
    text: `Hello ${employeeName},\n\nYour account has been created successfully.\nEmail: ${email}\nTemporary Password: ${tempPassword}\n\nPlease change your password upon logging in.`,
    html: `
      <h2>Welcome to the Team, ${employeeName}!</h2>
      <p>Your enterprise employee account is ready for use.</p>
      <p><b>Username / Email:</b> ${email}</p>
      <p><b>Temporary Password:</b> <code>${tempPassword}</code></p>
      <br/>
      <p>Please log in and update your security credentials.</p>
      <hr/>
      <p>Best Regards,<br/>Operations Team</p>
    `
  });
};

const sendLeaveEmail = async (email, employeeName, leaveDetails, actionType) => {
  const subject = `Leave Request Update: ${actionType.toUpperCase()}`;
  return await sendMail({
    to: email,
    subject,
    text: `Hello ${employeeName},\n\nYour leave request for ${leaveDetails.days} days starting ${leaveDetails.startDate} has been ${actionType}.`,
    html: `
      <h3>Leave Application Update</h3>
      <p>Hello ${employeeName},</p>
      <p>Your leave application has been processed.</p>
      <ul>
        <li><b>Leave Type:</b> ${leaveDetails.leaveType}</li>
        <li><b>Duration:</b> ${leaveDetails.days} Days</li>
        <li><b>Dates:</b> ${leaveDetails.startDate} to ${leaveDetails.endDate}</li>
        <li><b>Result:</b> <b style="color: ${actionType === 'approved' ? 'green' : 'red'}">${actionType.toUpperCase()}</b></li>
      </ul>
      <p>Log into the EMS portal to view details and feedback.</p>
    `
  });
};

const sendAssetEmail = async (email, employeeName, assetDetails, isAssigning = true) => {
  const subject = isAssigning ? 'Asset Allocated to You' : 'Asset Return Confirmed';
  return await sendMail({
    to: email,
    subject,
    text: `Hello ${employeeName},\n\nAsset "${assetDetails.name}" (Serial: ${assetDetails.serialNumber}) has been ${isAssigning ? 'assigned to' : 'returned by'} you.`,
    html: `
      <h3>Asset Transaction Receipt</h3>
      <p>Hello ${employeeName},</p>
      <p>This is to confirm that the following asset has been <b>${isAssigning ? 'ALLOCATED' : 'RETURNED'}</b>:</p>
      <ul>
        <li><b>Asset Name:</b> ${assetDetails.name}</li>
        <li><b>Asset Type:</b> ${assetDetails.type}</li>
        <li><b>Serial Number:</b> ${assetDetails.serialNumber}</li>
        <li><b>Condition:</b> ${assetDetails.condition}</li>
      </ul>
      <p>Thank you.</p>
    `
  });
};

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendLeaveEmail,
  sendAssetEmail
};
