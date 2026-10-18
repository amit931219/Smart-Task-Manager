const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  // If live credentials are provided in env
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Fallback to ethereal mock / test transporter so emails can be tested instantly without setup
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[EmailService] Initialized Ethereal test account: ${testAccount.user}`);
    return transporter;
  } catch (err) {
    console.warn('[EmailService] Using fallback logger transporter:', err.message);
    transporter = {
      sendMail: async (opts) => {
        console.log(`[EmailService - Simulated Send] To: ${opts.to} | Subject: ${opts.subject}`);
        return { messageId: 'simulated-' + Date.now() };
      },
    };
    return transporter;
  }
};

const sendTaskAssignedEmail = async ({ recipient, task, assignerName }) => {
  try {
    const client = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Smart Task Manager" <notifications@smarttaskmanager.com>',
      to: recipient.email,
      subject: `📋 New Task Assigned: ${task.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-top: 0;">You have been assigned a new task</h2>
          <p>Hi <strong>${recipient.name}</strong>,</p>
          <p><strong>${assignerName || 'Admin'}</strong> assigned you a task:</p>
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1e293b;">${task.title}</h3>
            <p style="margin: 0 0 10px 0; color: #475569;">${task.description || 'No description provided.'}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()} | <strong>Priority:</strong> <span style="text-transform: uppercase; color: #ef4444;">${task.priority}</span></p>
          </div>
          <p>Please log in to your Smart Task Manager dashboard to view details and start working.</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">Smart Task Manager Automated System</p>
        </div>
      `,
    };

    const info = await client.sendMail(mailOptions);
    if (nodemailer.getTestMessageUrl && nodemailer.getTestMessageUrl(info)) {
      console.log(`[EmailService] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    // In-app notification creation
    await Notification.create({
      recipient: recipient._id,
      title: 'New Task Assigned',
      message: `You were assigned: "${task.title}" (Due: ${new Date(task.dueDate).toLocaleDateString()})`,
      type: 'task_assigned',
      task: task._id,
    });

    return info;
  } catch (error) {
    console.error('[EmailService] Failed to send assignment email:', error.message);
  }
};

const sendOverdueAlertEmail = async ({ recipient, task }) => {
  try {
    const client = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Smart Task Manager" <notifications@smarttaskmanager.com>',
      to: recipient.email,
      subject: `⚠️ OVERDUE ALERT: Task "${task.title}" has passed its deadline`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px;">
          <h2 style="color: #dc2626; margin-top: 0;">Task Overdue Alert</h2>
          <p>Hi <strong>${recipient.name}</strong>,</p>
          <p>The following task is now <strong style="color: #dc2626;">OVERDUE</strong>:</p>
          <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; border-radius: 4px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #991b1b;">${task.title}</h3>
            <p style="margin: 0; font-size: 14px;"><strong>Original Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()} | <strong>Current Status:</strong> OVERDUE</p>
          </div>
          <p>Please update the task status immediately or request an extension from your admin.</p>
        </div>
      `,
    };

    const info = await client.sendMail(mailOptions);
    if (nodemailer.getTestMessageUrl && nodemailer.getTestMessageUrl(info)) {
      console.log(`[EmailService] Overdue Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    await Notification.create({
      recipient: recipient._id,
      title: 'Task Overdue Alert',
      message: `Task "${task.title}" has passed its deadline (${new Date(task.dueDate).toLocaleDateString()}). Please update status!`,
      type: 'overdue_alert',
      task: task._id,
    });

    return info;
  } catch (error) {
    console.error('[EmailService] Failed to send overdue alert email:', error.message);
  }
};

const sendStatusUpdateEmail = async ({ recipient, task, updaterName, oldStatus, newStatus }) => {
  try {
    const client = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Smart Task Manager" <notifications@smarttaskmanager.com>',
      to: recipient.email,
      subject: `🔄 Task Status Updated: ${task.title} is now ${newStatus.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0284c7; margin-top: 0;">Task Status Updated</h2>
          <p>Hi <strong>${recipient.name}</strong>,</p>
          <p><strong>${updaterName}</strong> updated the status of task <strong>"${task.title}"</strong>:</p>
          <p><strong>Status Changed:</strong> <span style="text-decoration: line-through; color: #64748b;">${oldStatus}</span> &rarr; <span style="color: #16a34a; font-weight: bold; text-transform: uppercase;">${newStatus}</span></p>
        </div>
      `,
    };

    const info = await client.sendMail(mailOptions);

    await Notification.create({
      recipient: recipient._id,
      title: 'Task Status Updated',
      message: `"${task.title}" updated from ${oldStatus} to ${newStatus} by ${updaterName}`,
      type: 'status_change',
      task: task._id,
    });

    return info;
  } catch (error) {
    console.error('[EmailService] Failed to send status update email:', error.message);
  }
};

module.exports = {
  sendTaskAssignedEmail,
  sendOverdueAlertEmail,
  sendStatusUpdateEmail,
};
