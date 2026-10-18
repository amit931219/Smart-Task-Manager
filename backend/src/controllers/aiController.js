const aiService = require('../services/aiService');
const Task = require('../models/Task');
const { logActivity } = require('../services/activityService');

// @desc    1. AI Email-to-Task Converter
// @route   POST /api/ai/parse-email
// @access  Private
const parseEmail = async (req, res, next) => {
  try {
    const { subject, body } = req.body;
    if (!subject && !body) {
      return res.status(400).json({ success: false, message: 'Subject or body is required' });
    }

    const parsed = await aiService.parseEmailToTask(subject || '', body || '');
    res.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    2. AI Subtask Generator
// @route   POST /api/ai/subtasks
// @access  Private
const generateSubtasks = async (req, res, next) => {
  try {
    const { taskTitle, taskDescription } = req.body;
    if (!taskTitle) {
      return res.status(400).json({ success: false, message: 'taskTitle is required' });
    }

    const subtasks = await aiService.generateSubtasks(taskTitle, taskDescription || '');
    res.json({
      success: true,
      data: subtasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    3. AI Priority and Deadline Assistant
// @route   POST /api/ai/priority-deadline-check
// @access  Private
const checkPriorityAndDeadline = async (req, res, next) => {
  try {
    const { title, description, dueDate, subtasks } = req.body;
    if (!dueDate) {
      return res.status(400).json({ success: false, message: 'dueDate is required' });
    }

    const evaluation = await aiService.analyzePriorityAndDeadline({
      title: title || '',
      description: description || '',
      dueDate,
      subtasks: subtasks || [],
    });

    res.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    4. AI Task Summary Assistant (Grounded in DB queries)
// @route   POST /api/ai/summary
// @access  Private
const generateSummary = async (req, res, next) => {
  try {
    const { department } = req.body;
    const filter = {};
    if (department && department !== 'All') {
      filter.department = department;
    }

    // Query database first with strict code so AI cannot invent fake tasks
    const tasks = await Task.find(filter).populate('assignee', 'name email department');

    const summary = await aiService.generateTaskSummary({
      department: department || 'All Departments',
      tasks,
    });

    await logActivity({
      user: req.user._id,
      action: 'AI_SUBTASKS_ADDED', // or summary generated
      details: `${req.user.name} generated an AI summary report for department "${department || 'All Departments'}"`,
    });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  parseEmail,
  generateSubtasks,
  checkPriorityAndDeadline,
  generateSummary,
};

