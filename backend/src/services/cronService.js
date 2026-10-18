const cron = require('node-cron');
const Task = require('../models/Task');
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

// Initialize cron schedule (Runs every hour: '0 * * * *')
const initCronJobs = () => {
  // Cron schedule: every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[CronService] Running scheduled hourly overdue tasks check...');
    await checkAndProcessOverdueTasks();
  });

  console.log('[CronService] Background overdue task cron job scheduled.');
};

module.exports = {
  initCronJobs,
  checkAndProcessOverdueTasks,
};

