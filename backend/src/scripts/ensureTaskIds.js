const mongoose = require('mongoose');
const Task = require('../models/Task');
require('dotenv').config({ path: __dirname + '/../../.env' });

async function fixTaskIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_task_manager');
    const tasks = await Task.find({}).sort({ createdAt: 1 });
    console.log(`Found ${tasks.length} task(s) in database.`);

    // Temporary update to avoid unique index collisions during renumbering
    for (let i = 0; i < tasks.length; i++) {
      await Task.updateOne({ _id: tasks[i]._id }, { $set: { taskId: `TEMP-${Date.now()}-${i}` } });
    }

    // Clean sequential assignment
    for (let i = 0; i < tasks.length; i++) {
      const cleanId = `TASK-2026-${String(i + 1).padStart(5, '0')}`;
      await Task.updateOne({ _id: tasks[i]._id }, { $set: { taskId: cleanId } });
      console.log(`Cleaned: ${cleanId} -> "${tasks[i].title}"`);
    }

    const nextId = await Task.generateNextTaskId();
    console.log(`NEXT AUTO-GENERATED TASK ID WILL BE: ${nextId}`);
  } catch (err) {
    console.error('Error fixing task IDs:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixTaskIds();
