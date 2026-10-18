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
    const results = await gmailService.syncGmailInbox();
    res.json({
      success: true,
      message: `Gmail sync completed. Processed ${results.length} email(s).`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Simulate custom incoming email for AI parsing
// @route   POST /api/gmail/simulate
// @access  Private
const simulateEmail = async (req, res, next) => {
  try {
    const { from, subject, body } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ success: false, message: 'Subject and body are required' });
    }

    const draft = await gmailService.simulateIncomingEmail({ from, subject, body });
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
    const task = await Task.create({
      title: taskTitle,
      description: description || draft.extractedTask.description || draft.body,
      priority: taskPriority,
      dueDate: taskDueDate,
      department: taskDepartment,
      creator: req.user._id,
      assignee: taskAssigneeId,
      subtasks: formattedSubtasks,
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

module.exports = {
  syncInbox,
  simulateEmail,
  getDrafts,
  approveDraft,
  rejectDraft,
  getStatus,
};
