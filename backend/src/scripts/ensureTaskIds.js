const mongoose = require('mongoose');
const Task = require('../models/Task');
require('dotenv').config({ path: __dirname + '/../../.env' });

async function ensureTaskIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_task_manager');
    const tasks = await Task.find({
      $or: [{ taskId: { $exists: false } }, { taskId: null }, { taskId: '' }]
    });

    console.log(`Found ${tasks.length} task(s) needing human-readable Task IDs.`);

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const count = await Task.countDocuments({ taskId: { $exists: true, $ne: null } });
      t.taskId = `TASK-2026-${String(count + 1 + i).padStart(5, '0')}`;

      if (t.progress === undefined || t.progress === null) {
        if (t.status === 'completed') {
          t.progress = 100;
        } else if (t.subtasks && t.subtasks.length > 0) {
          const completedCount = t.subtasks.filter((s) => s.completed).length;
          t.progress = Math.round((completedCount / t.subtasks.length) * 100);
        } else {
          t.progress = t.status === 'in-progress' ? 40 : 0;
        }
      }

      await t.save();
      console.log(`Assigned ID: ${t.taskId} -> "${t.title}" (Progress: ${t.progress}%)`);
    }

    console.log('Task IDs and progress values successfully ensured!');
  } catch (err) {
    console.error('Error ensuring task IDs:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

ensureTaskIds();

