const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const EmailDraft = require('../models/EmailDraft');

// @desc    Get dashboard metrics, breakdown charts, and summary statistics
// @route   GET /api/dashboard
// @access  Private
const getDashboardMetrics = async (req, res, next) => {
  try {
    const isEmployee = req.user.role === 'employee';
    const filter = isEmployee && req.query.personal === 'true' ? { assignee: req.user._id } : {};

    const totalTasks = await Task.countDocuments(filter);
    const completedTasks = await Task.countDocuments({ ...filter, status: 'completed' });
    const inProgressTasks = await Task.countDocuments({ ...filter, status: 'in-progress' });
    const pendingTasks = await Task.countDocuments({ ...filter, status: 'pending' });
    const overdueTasks = await Task.countDocuments({ ...filter, status: 'overdue' });

    const emailTasksCount = await Task.countDocuments({ ...filter, source: 'gmail' });
    const pendingDraftsCount = await EmailDraft.countDocuments({ status: 'pending_review' });

    // Status distribution
    const statusDistribution = [
      { name: 'Completed', value: completedTasks, color: '#16a34a' },
      { name: 'In Progress', value: inProgressTasks, color: '#2563eb' },
      { name: 'Pending', value: pendingTasks, color: '#f59e0b' },
      { name: 'Overdue', value: overdueTasks, color: '#dc2626' },
    ];

    // Priority breakdown
    const priorityAgg = await Task.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);
    const priorityMap = { low: 0, medium: 0, high: 0, urgent: 0 };
    priorityAgg.forEach((item) => {
      if (item._id && priorityMap[item._id] !== undefined) {
        priorityMap[item._id] = item.count;
      }
    });

    const priorityBreakdown = [
      { priority: 'Low', count: priorityMap.low, fill: '#64748b' },
      { priority: 'Medium', count: priorityMap.medium, fill: '#0ea5e9' },
      { priority: 'High', count: priorityMap.high, fill: '#f97316' },
      { priority: 'Urgent', count: priorityMap.urgent, fill: '#ef4444' },
    ];

    // Department breakdown
    const departmentAgg = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          overdue: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Urgent / Overdue Tasks spotlight
    const urgentOverdueTasks = await Task.find({
      ...filter,
      $or: [{ status: 'overdue' }, { priority: 'urgent' }],
      status: { $ne: 'completed' },
    })
      .populate('assignee', 'name email')
      .sort({ dueDate: 1 })
      .limit(5);

    // Recent activities
    const recentActivities = await ActivityLog.find({})
      .populate('user', 'name role')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .limit(6);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      success: true,
      data: {
        metrics: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingTasks,
          overdueTasks,
          completionRate,
          emailTasksCount,
          pendingDraftsCount,
        },
        statusDistribution,
        priorityBreakdown,
        departmentBreakdown: departmentAgg.map((d) => ({
          department: d._id || 'General',
          total: d.total,
          completed: d.completed,
          overdue: d.overdue,
        })),
        urgentOverdueTasks,
        recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
};
