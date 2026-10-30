const Task = require('../models/Task');
const User = require('../models/User');
const { sendTaskAssignedEmail, sendStatusUpdateEmail } = require('../services/emailService');
const { logActivity } = require('../services/activityService');
const { checkAndProcessOverdueTasks } = require('../services/cronService');

// @desc    Get all tasks with filters, search, and pagination
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, department, assignee, search, scope, sort = '-createdAt' } = req.query;

    const query = {};

    // Scope filtering (Point 2: Assigned to me, Point 4: Created by me)
    if (scope === 'assigned' || scope === 'my-tasks') {
      query.assignee = req.user._id;
    } else if (scope === 'created') {
      query.creator = req.user._id;
    } else if (req.user.role === 'employee' && !assignee) {
      // Default employee view: allow them to see all or filter by assigned
      // query.assignee = req.user._id;
    }

    if (assignee) {
      query.assignee = assignee;
    }

    if (scope === 'due_today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      query.dueDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { taskId: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(query)
      .populate('creator', 'name email role')
      .populate('assignee', 'name email role department')
      .sort(sort);

    res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('creator', 'name email role')
      .populate('assignee', 'name email role department');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, department, assignee, subtasks, source, emailMetadata } = req.body;

    const assignedUser = await User.findById(assignee);
    if (!assignedUser) {
      return res.status(400).json({ success: false, message: 'Assignee user not found' });
    }

    const taskId = await Task.generateNextTaskId();

    const task = await Task.create({
      taskId,
      title,
      description,
      priority: priority || 'medium',
      dueDate,
      department: department || assignedUser.department || 'General',
      creator: req.user._id,
      assignee,
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      source: source || 'manual',
      emailMetadata,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('creator', 'name email role')
      .populate('assignee', 'name email role department');

    // Send email notification to assignee
    await sendTaskAssignedEmail({
      recipient: assignedUser,
      task: populatedTask,
      assignerName: req.user.name,
    });

    // Audit log
    await logActivity({
      user: req.user._id,
      task: task._id,
      action: 'CREATED_TASK',
      details: `${req.user.name} created task "${task.title}" assigned to ${assignedUser.name}`,
    });

    res.status(201).json({
      success: true,
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { title, description, priority, dueDate, department, assignee, status, progress } = req.body;

    // Track if assignee changed
    const previousAssigneeId = task.assignee.toString();

    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;
    task.department = department || task.department;
    if (assignee) task.assignee = assignee;
    if (progress !== undefined) task.progress = Number(progress);
    if (status) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date();
        task.progress = 100;
      }
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('creator', 'name email role')
      .populate('assignee', 'name email role department');

    // If reassigned, notify new assignee
    if (assignee && assignee !== previousAssigneeId) {
      const newAssignee = await User.findById(assignee);
      if (newAssignee) {
        await sendTaskAssignedEmail({
          recipient: newAssignee,
          task: updatedTask,
          assignerName: req.user.name,
        });
      }
    }

    await logActivity({
      user: req.user._id,
      task: task._id,
      action: 'UPDATED_TASK',
      details: `${req.user.name} updated task "${task.title}"`,
    });

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'in-progress', 'completed', 'overdue'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const task = await Task.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('assignee', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const oldStatus = task.status;
    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
      task.progress = 100;
    } else {
      task.completedAt = null;
      if (task.progress === 100) task.progress = 50;
    }

    await task.save();

    // Notify task creator when status changes
    if (task.creator && task.creator._id.toString() !== req.user._id.toString()) {
      await sendStatusUpdateEmail({
        recipient: task.creator,
        task,
        updaterName: req.user.name,
        oldStatus,
        newStatus: status,
      });
    }

    await logActivity({
      user: req.user._id,
      task: task._id,
      action: 'UPDATED_STATUS',
      details: `${req.user.name} updated status of "${task.title}" from ${oldStatus} to ${status}`,
    });

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle subtask completion
// @route   PATCH /api/tasks/:id/subtasks/:subtaskId
// @access  Private
const toggleSubtask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ success: false, message: 'Subtask not found' });
    }

    subtask.completed = !subtask.completed;
    await task.save();

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add subtask to task
// @route   POST /api/tasks/:id/subtasks
// @access  Private
const addSubtask = async (req, res, next) => {
  try {
    const { title, suggestedByAI } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Subtask title required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.subtasks.push({
      title,
      completed: false,
      suggestedByAI: !!suggestedByAI,
    });

    await task.save();

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin or task creator)
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (req.user.role !== 'admin' && task.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);

    await logActivity({
      user: req.user._id,
      action: 'DELETED_TASK',
      details: `${req.user.name} deleted task "${task.title}"`,
    });

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger instant check for overdue tasks
// @route   POST /api/tasks/check-overdue
// @access  Private
const triggerOverdueCheck = async (req, res, next) => {
  try {
    const result = await checkAndProcessOverdueTasks();
    res.json({
      success: true,
      message: `Checked overdue tasks. Found and alerted for ${result.count} task(s).`,
      count: result.count,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  toggleSubtask,
  addSubtask,
  deleteTask,
  triggerOverdueCheck,
};

