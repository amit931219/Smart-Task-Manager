const ActivityLog = require('../models/ActivityLog');

// @desc    Get activity logs with pagination and filters
// @route   GET /api/activity
// @access  Private
const getActivityLogs = async (req, res, next) => {
  try {
    const { action, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (action) {
      filter.action = action;
    }

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .populate('user', 'name email role department')
      .populate('task', 'title priority status')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs,
};

