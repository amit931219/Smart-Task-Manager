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
    taskId: {
      type: String,
      unique: true,
      index: true,
    },
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
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
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

// Auto-assign human-readable Task ID (e.g. TASK-2026-00042) and compute progress
taskSchema.pre('save', async function (next) {
  if (!this.taskId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Task').countDocuments();
    const padded = String(count + 1).padStart(5, '0');
    this.taskId = `TASK-${year}-${padded}`;
  }

  // Calculate progress from subtasks if subtasks exist
  if (this.subtasks && this.subtasks.length > 0) {
    const completedCount = this.subtasks.filter((s) => s.completed).length;
    this.progress = Math.round((completedCount / this.subtasks.length) * 100);
    if (this.progress === 100 && this.status !== 'completed') {
      this.status = 'completed';
      this.completedAt = new Date();
    }
  } else if (this.status === 'completed') {
    this.progress = 100;
  }

  next();
});

// Indexing for rapid queries, filters, and dashboard metrics
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ creator: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ department: 1 });

module.exports = mongoose.model('Task', taskSchema);

