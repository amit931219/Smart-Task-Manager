const EmailDraft = require('../models/EmailDraft');
const Task = require('../models/Task');
const User = require('../models/User');
const gmailService = require('../services/gmailService');
const { sendTaskAssignedEmail } = require('../services/emailService');
const { logActivity } = require('../services/activityService');

// @desc    Sync central Gmail inbox (reads unread emails or runs simulation)
// @route   POST /api/gmail/sync
// @access  Private
const syncInbox = async (req, res, next) => {
  try {
    const result = await gmailService.syncGmailInbox();
    const count = result.processedCount !== undefined ? result.processedCount : (Array.isArray(result) ? result.length : 0);
    const total = result.totalChecked !== undefined ? result.totalChecked : count;

    let message = '';
    if (count > 0) {
      message = `Gmail sync successful! Processed and parsed ${count} new email task(s). Review and approve below!`;
    } else {
      message = `Gmail connected & checked (${total} recent email(s) found). 0 new tasks to convert (emails may have already been synced into drafts below).`;
    }

    res.json({
      success: true,
      message,
      data: result.drafts || result,
      meta: result,
    });
  } catch (error) {
    console.error('syncInbox Error:', error.message);
    res.status(500).json({
      success: false,
      message: `Gmail API Error: ${error.message}. Please check your connection or re-authorize.`,
    });
  }
};

// @desc    Simulate custom incoming email for AI parsing
// @route   POST /api/gmail/simulate
// @access  Private
const simulateEmail = async (req, res, next) => {
  try {
    const { from, subject, body, attachments } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ success: false, message: 'Subject and body are required' });
    }

    const draft = await gmailService.simulateIncomingEmail({ from, subject, body, attachments });
    res.status(201).json({
      success: true,
      message: 'Simulated email received and AI parsed into draft task.',
      data: draft,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all email drafts (pending review, approved, or rejected)
// @route   GET /api/gmail/drafts
// @access  Private
const getDrafts = async (req, res, next) => {
  try {
    const { status = 'pending_review' } = req.query;
    const filter = status === 'all' ? {} : { status };

    const drafts = await EmailDraft.find(filter)
      .populate('extractedTask.matchedUserId', 'name email department')
      .populate('processedTaskId', 'title status dueDate')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: drafts.length,
      data: drafts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review & Approve draft -> Create official Task
// @route   POST /api/gmail/drafts/:id/approve
// @access  Private
const approveDraft = async (req, res, next) => {
  try {
    const draft = await EmailDraft.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({ success: false, message: 'Email draft not found' });
    }

    if (draft.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Draft is already approved' });
    }

    // Allow overriding fields from human review modal in React UI
    const {
      title,
      description,
      assigneeId,
      priority,
      dueDate,
      department,
      subtasks,
    } = req.body;

    const taskTitle = title || draft.extractedTask.title;
    const taskAssigneeId = assigneeId || draft.extractedTask.matchedUserId || req.user._id;
    const taskPriority = priority || draft.extractedTask.priority || 'medium';
    const taskDueDate = dueDate || draft.extractedTask.dueDate || new Date(Date.now() + 3 * 86400000);
    const taskDepartment = department || draft.extractedTask.department || 'General';

    const assignedUser = await User.findById(taskAssigneeId);
    if (!assignedUser) {
      return res.status(400).json({ success: false, message: 'Assignee user not found' });
    }

    // Build subtasks
    let formattedSubtasks = [];
    if (Array.isArray(subtasks) && subtasks.length > 0) {
      formattedSubtasks = subtasks;
    } else if (draft.extractedTask.suggestedSubtasks && draft.extractedTask.suggestedSubtasks.length > 0) {
      formattedSubtasks = draft.extractedTask.suggestedSubtasks.map((s) => ({
        title: s.title,
        completed: false,
        suggestedByAI: true,
      }));
    }

    // 1. Create task in MongoDB
    const taskId = await Task.generateNextTaskId();

    const task = await Task.create({
      taskId,
      title: taskTitle,
      description: description || draft.extractedTask.description || draft.body,
      priority: taskPriority,
      dueDate: taskDueDate,
      department: taskDepartment,
      creator: req.user._id,
      assignee: taskAssigneeId,
      subtasks: formattedSubtasks,
      attachments: draft.attachments || [],
      source: 'gmail',
      emailMetadata: {
        messageId: draft.messageId,
        from: draft.from,
        subject: draft.subject,
        receivedAt: draft.receivedAt,
        rawSnippet: draft.body.substring(0, 200),
      },
    });

    // 2. Mark draft as approved
    draft.status = 'approved';
    draft.processedTaskId = task._id;
    await draft.save();

    // 3. Notify assignee via email & in-app
    await sendTaskAssignedEmail({
      recipient: assignedUser,
      task,
      assignerName: `Gmail Integration (Approved by ${req.user.name})`,
    });

    // 4. Audit Log
    await logActivity({
      user: req.user._id,
      task: task._id,
      action: 'EMAIL_DRAFT_APPROVED',
      details: `${req.user.name} reviewed and approved email task "${task.title}" for ${assignedUser.name}`,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('creator', 'name email role')
      .populate('assignee', 'name email role department');

    res.json({
      success: true,
      message: 'Draft approved and task created successfully',
      data: {
        draft,
        task: populatedTask,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject / Discard email draft
// @route   POST /api/gmail/drafts/:id/reject
// @access  Private
const rejectDraft = async (req, res, next) => {
  try {
    const draft = await EmailDraft.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({ success: false, message: 'Email draft not found' });
    }

    draft.status = 'rejected';
    await draft.save();

    await logActivity({
      user: req.user._id,
      action: 'EMAIL_DRAFT_REJECTED',
      details: `${req.user.name} rejected email draft "${draft.subject}"`,
    });

    res.json({
      success: true,
      message: 'Draft rejected successfully',
      data: draft,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Gmail connection status
// @route   GET /api/gmail/status
// @access  Private
const getStatus = async (req, res, next) => {
  try {
    const isLiveConfigured = !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_REFRESH_TOKEN);
    res.json({
      success: true,
      data: {
        mode: isLiveConfigured ? 'live_gmail_api' : 'interactive_simulator',
        centralEmail: process.env.CENTRAL_GMAIL_USER || 'tasks@smarttaskmanager.com',
        isOAuthConnected: isLiveConfigured,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Google OAuth Authorization URL
// @route   GET /api/gmail/auth-url
// @access  Public / Private
const getAuthUrl = (req, res, next) => {
  try {
    const url = gmailService.generateAuthUrl();
    res.json({ success: true, url });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    OAuth2 Callback Handler from Google
// @route   GET /api/gmail/oauth2callback
// @access  Public
const oauth2Callback = async (req, res, next) => {
  try {
    const { code, error } = req.query;
    if (error) {
      return res.status(400).send(`<h3>Google OAuth Error: ${error}</h3>`);
    }
    if (!code) {
      return res.status(400).send('<h3>Authorization code missing.</h3>');
    }

    const tokens = await gmailService.getTokensFromCode(code);
    const refreshToken = tokens.refresh_token;

    if (refreshToken) {
      process.env.GMAIL_REFRESH_TOKEN = refreshToken;

      // Update backend/.env file so it persists
      const fs = require('fs');
      const path = require('path');
      const envPath = path.resolve(__dirname, '../../.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('GMAIL_REFRESH_TOKEN=')) {
          envContent = envContent.replace(/GMAIL_REFRESH_TOKEN=.*$/m, `GMAIL_REFRESH_TOKEN=${refreshToken}`);
        } else {
          envContent += `\nGMAIL_REFRESH_TOKEN=${refreshToken}`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    }

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gmail Connected - Smart Task Manager</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
            h2 { color: #38bdf8; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .btn { display: inline-block; background: #2563eb; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-top: 16px; }
            .btn:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>🎉 Gmail Connected Successfully!</h2>
            <p>Your Google account has been authorized. Smart Task Manager can now fetch real unread emails and convert them into draft tasks automatically.</p>
            <a href="http://localhost:5173/gmail" class="btn">Return to Task Manager</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`<h3>Failed to complete OAuth token exchange: ${error.message}</h3>`);
  }
};

// @desc    Update Gmail configuration directly (e.g. Refresh Token, Client ID)
// @route   POST /api/gmail/config
// @access  Private
const updateGmailConfig = async (req, res, next) => {
  try {
    const { refreshToken, clientId, clientSecret, centralEmail } = req.body;
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(__dirname, '../../.env');

    if (!fs.existsSync(envPath)) {
      return res.status(500).json({ success: false, message: '.env file not found' });
    }

    let envContent = fs.readFileSync(envPath, 'utf8');

    if (refreshToken !== undefined) {
      process.env.GMAIL_REFRESH_TOKEN = refreshToken.trim();
      if (envContent.includes('GMAIL_REFRESH_TOKEN=')) {
        envContent = envContent.replace(/GMAIL_REFRESH_TOKEN=.*$/m, `GMAIL_REFRESH_TOKEN=${refreshToken.trim()}`);
      } else {
        envContent += `\nGMAIL_REFRESH_TOKEN=${refreshToken.trim()}`;
      }
    }

    if (clientId) {
      process.env.GMAIL_CLIENT_ID = clientId.trim();
      if (envContent.includes('GMAIL_CLIENT_ID=')) {
        envContent = envContent.replace(/GMAIL_CLIENT_ID=.*$/m, `GMAIL_CLIENT_ID=${clientId.trim()}`);
      } else {
        envContent += `\nGMAIL_CLIENT_ID=${clientId.trim()}`;
      }
    }

    if (clientSecret) {
      process.env.GMAIL_CLIENT_SECRET = clientSecret.trim();
      if (envContent.includes('GMAIL_CLIENT_SECRET=')) {
        envContent = envContent.replace(/GMAIL_CLIENT_SECRET=.*$/m, `GMAIL_CLIENT_SECRET=${clientSecret.trim()}`);
      } else {
        envContent += `\nGMAIL_CLIENT_SECRET=${clientSecret.trim()}`;
      }
    }

    if (centralEmail) {
      process.env.CENTRAL_GMAIL_USER = centralEmail.trim();
      if (envContent.includes('CENTRAL_GMAIL_USER=')) {
        envContent = envContent.replace(/CENTRAL_GMAIL_USER=.*$/m, `CENTRAL_GMAIL_USER=${centralEmail.trim()}`);
      } else {
        envContent += `\nCENTRAL_GMAIL_USER=${centralEmail.trim()}`;
      }
    }

    fs.writeFileSync(envPath, envContent, 'utf8');

    const isConnected = !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_REFRESH_TOKEN);

    res.json({
      success: true,
      message: 'Gmail configuration updated successfully!',
      data: {
        isOAuthConnected: isConnected,
        mode: isConnected ? 'live_gmail_api' : 'interactive_simulator',
        centralEmail: process.env.CENTRAL_GMAIL_USER,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download or view an attachment file
// @route   GET /api/gmail/attachments/:filename
// @access  Public
const downloadAttachment = async (req, res, next) => {
  try {
    const rawFilename = req.params.filename;
    // Security check against directory traversal
    const safeFilename = path.basename(rawFilename);
    const filePath = path.join(__dirname, '../../uploads/attachments', safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Attachment file not found' });
    }

    const downloadName = req.query.name || safeFilename;
    const isDownload = req.query.download === 'true' || req.query.dl === '1';

    if (isDownload) {
      return res.download(filePath, downloadName);
    } else {
      return res.sendFile(filePath);
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  syncInbox,
  simulateEmail,
  getDrafts,
  approveDraft,
  rejectDraft,
  getStatus,
  getAuthUrl,
  oauth2Callback,
  updateGmailConfig,
  downloadAttachment,
};

