const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({ user, task, action, details, metadata = {} }) => {
  try {
    const log = await ActivityLog.create({
      user: user || null,
      task: task || null,
      action,
      details,
      metadata,
    });
    return log;
  } catch (error) {
    console.error('Failed to record activity log:', error.message);
    return null;
  }
};

module.exports = {
  logActivity,
};
