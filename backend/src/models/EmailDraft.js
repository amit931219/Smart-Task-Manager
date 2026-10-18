const mongoose = require('mongoose');

const emailDraftSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
    },
    from: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    extractedTask: {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        default: '',
      },
      assigneeName: {
        type: String,
        default: '',
      },
      matchedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
      },
      dueDate: {
        type: Date,
      },
      department: {
        type: String,
        default: 'General',
      },
      confidence: {
        type: Number,
        default: 0.9,
      },
      suggestedSubtasks: [
        {
          title: String,
        },
      ],
      aiExplanation: {
        type: String,
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected'],
      default: 'pending_review',
    },
    processedTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
  },
  {
    timestamps: true,
  }
);

emailDraftSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('EmailDraft', emailDraftSchema);
