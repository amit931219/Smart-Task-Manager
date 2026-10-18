const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: false,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATED_TASK',
        'UPDATED_TASK',
        'UPDATED_STATUS',
        'DELETED_TASK',
        'ASSIGNED_TASK',
        'GMAIL_SYNCED',
        'EMAIL_DRAFT_APPROVED',
        'EMAIL_DRAFT_REJECTED',
        'AI_SUBTASKS_ADDED',
        'AI_PRIORITY_APPLIED',
        'OVERDUE_ALERT_SENT',
        'USER_LOGIN',
      ],
    },
    details: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);

