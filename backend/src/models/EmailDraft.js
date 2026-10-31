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
      default: 'unknown@domain.com',
      trim: true,
    },
    subject: {
      type: String,
      default: '(No Subject)',
      trim: true,
      set: (v) => (!v || !String(v).trim() ? '(No Subject)' : String(v).trim()),
    },
    body: {
      type: String,
      default: '',
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    extractedTask: {
      title: {
        type: String,
        default: 'New Task from Email',
        trim: true,
        set: (v) => (!v || !String(v).trim() ? 'New Task from Email' : String(v).trim()),
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
    attachments: [
      {
        filename: { type: String, required: true },
        originalName: { type: String },
        contentType: { type: String, default: 'application/octet-stream' },
        size: { type: Number, default: 0 },
        savedFilename: { type: String },
        path: { type: String },
        url: { type: String },
        downloadUrl: { type: String },
        attachmentId: { type: String },
        messageId: { type: String },
      },
    ],
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

