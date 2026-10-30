const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { sendOverdueAlertEmail } = require('./emailService');
const { logActivity } = require('./activityService');

// Core overdue check logic
const checkAndProcessOverdueTasks = async () => {
  try {
    const now = new Date();
    // Find tasks whose deadline has passed, not completed, and not already marked overdue
    const overdueTasks = await Task.find({
      dueDate: { $lt: now },
      status: { $in: ['pending', 'in-progress'] },
    }).populate('assignee', 'name email');

    if (overdueTasks.length === 0) {
      return { count: 0, tasks: [] };
    }

    console.log(`[CronService] Found ${overdueTasks.length} overdue task(s). Processing alerts...`);

    const updatedTasks = [];
    for (const task of overdueTasks) {
      task.status = 'overdue';
      await task.save();

      // Send email alert to assignee if assigned
      if (task.assignee && task.assignee.email) {
        await sendOverdueAlertEmail({
          recipient: task.assignee,
          task,
        });
      }

      await logActivity({
        task: task._id,
        action: 'OVERDUE_ALERT_SENT',
        details: `Task "${task.title}" became overdue. Alert sent to ${task.assignee ? task.assignee.name : 'unassigned'}.`,
        metadata: { dueDate: task.dueDate },
      });

      updatedTasks.push(task);
    }

    return {
      count: updatedTasks.length,
      tasks: updatedTasks,
    };
  } catch (error) {
    console.error('[CronService] Error in overdue task check:', error.message);
    throw error;
  }
};

// Check for tasks due today or tomorrow (Point 7: Automatic Alerts)
const checkDueTodayAndTomorrowTasks = async () => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

    const upcomingTasks = await Task.find({
      dueDate: { $gte: startOfToday, $lt: endOfTomorrow },
      status: { $in: ['pending', 'in-progress'] },
    }).populate('assignee', 'name email');

    for (const t of upcomingTasks) {
      const isDueToday = t.dueDate.toDateString() === now.toDateString();
      const titlePrefix = isDueToday ? '🔴 Task Due Today' : '🟡 Task Due Tomorrow';

      // Check if notification already dispatched today
      const alreadySent = await Notification.findOne({
        task: t._id,
        type: 'deadline_warning',
        createdAt: { $gte: startOfToday },
      });

      if (!alreadySent && t.assignee) {
        await Notification.create({
          recipient: t.assignee._id,
          title: `${titlePrefix}: ${t.title}`,
          message: `${t.taskId ? `[${t.taskId}] ` : ''}Deliverable is due ${isDueToday ? 'today' : 'tomorrow'} (${t.dueDate.toLocaleDateString()}).`,
          type: 'deadline_warning',
          task: t._id,
        });
      }
    }
  } catch (err) {
    console.warn('[CronService] Error checking upcoming deadlines:', err.message);
  }
};

// Initialize cron schedule (Runs every hour: '0 * * * *')
const initCronJobs = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[CronService] Running scheduled hourly overdue and deadline check...');
    await checkAndProcessOverdueTasks();
    await checkDueTodayAndTomorrowTasks();
  });

  console.log('[CronService] Background overdue & deadline alert cron job scheduled.');
};

module.exports = {
  initCronJobs,
  checkAndProcessOverdueTasks,
  checkDueTodayAndTomorrowTasks,
};

