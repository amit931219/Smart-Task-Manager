const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  suggestedByAI: {
    type: Boolean,
    default: false,
  },
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'overdue'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide a due date'],
    },
    department: {
      type: String,
      default: 'General',
      trim: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subtasks: [subtaskSchema],
    source: {
      type: String,
      enum: ['manual', 'gmail'],
      default: 'manual',
    },
    emailMetadata: {
      messageId: String,
      from: String,
      subject: String,
      receivedAt: Date,
      rawSnippet: String,
    },
    aiAnalysis: {
      suggestedPriority: String,
      reasoning: String,
      riskScore: Number,
      isOverdueRisk: Boolean,
      analyzedAt: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for rapid queries, filters, and dashboard metrics
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ department: 1 });

module.exports = mongoose.model('Task', taskSchema);

