require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const EmailDraft = require('../models/EmailDraft');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_task_manager';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for database seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Task.deleteMany({});
    await ActivityLog.deleteMany({});
    await Notification.deleteMany({});
    await EmailDraft.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create Users
    const admin = await User.create({
      name: 'Dr. Vikrant Verma',
      email: 'admin@smarttask.com',
      password: 'password123',
      role: 'admin',
      department: 'Management',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    });

    const rahul = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@smarttask.com',
      password: 'password123',
      role: 'employee',
      department: 'CSE',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    });

    const priya = await User.create({
      name: 'Priya Patel',
      email: 'priya@smarttask.com',
      password: 'password123',
      role: 'employee',
      department: 'CSE',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    });

    const amit = await User.create({
      name: 'Amit Tomar',
      email: 'amit@smarttask.com',
      password: 'password123',
      role: 'employee',
      department: 'IT',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    });

    console.log('Created Users:');
    console.log('  Admin    : admin@smarttask.com / password123');
    console.log('  Employee : rahul@smarttask.com / password123');
    console.log('  Employee : priya@smarttask.com / password123');
    console.log('  Employee : amit@smarttask.com  / password123');

    // 2. Create Initial Tasks
    const now = Date.now();
    const task1 = await Task.create({
      title: 'Prepare BCS402 Course File for NAAC Audit',
      description: 'Compile full syllabus coverage, lecture plans, assignments, and sample answer sheets for BCS402 course.',
      priority: 'high',
      status: 'in-progress',
      dueDate: new Date(now + 2 * 86400000), // Due in 2 days
      department: 'CSE',
      creator: admin._id,
      assignee: rahul._id,
      source: 'gmail',
      emailMetadata: {
        messageId: 'sim-msg-101',
        from: 'dr.sharma@college.edu',
        subject: 'BCS402 Course File Preparation',
        receivedAt: new Date(now - 86400000),
        rawSnippet: 'Please ask Rahul to prepare the BCS402 course file by Monday. This is high priority.',
      },
      subtasks: [
        { title: 'Collect course syllabus and lecture schedule', completed: true, suggestedByAI: true },
        { title: 'Compile lecture notes and presentations', completed: true, suggestedByAI: true },
        { title: 'Include previous year question papers & solutions', completed: false, suggestedByAI: true },
        { title: 'Record student attendance and internal test marks', completed: false, suggestedByAI: true },
      ],
      aiAnalysis: {
        suggestedPriority: 'high',
        reasoning: 'Upcoming NAAC inspection deadline requires prompt compilation of all documentation.',
        riskScore: 65,
        isOverdueRisk: false,
        analyzedAt: new Date(),
      },
    });

    const task2 = await Task.create({
      title: 'Annual Department Research & Publications Report',
      description: 'Collate all SCI/Scopus journal publications, conference proceedings, and funded patents for CSE.',
      priority: 'medium',
      status: 'pending',
      dueDate: new Date(now + 5 * 86400000), // Due in 5 days
      department: 'CSE',
      creator: admin._id,
      assignee: priya._id,
      source: 'manual',
      subtasks: [
        { title: 'Gather faculty publications and citations', completed: false, suggestedByAI: true },
        { title: 'Collate student achievements and placement records', completed: false, suggestedByAI: true },
        { title: 'Summarize department workshops and guest lectures', completed: false, suggestedByAI: true },
        { title: 'Format document as per institute guidelines', completed: false, suggestedByAI: true },
      ],
    });

    const task3 = await Task.create({
      title: 'Upgrade Staging Database & Apply Indexing',
      description: 'Optimize MongoDB queries, create compound indexes for task lookups and overdue scans.',
      priority: 'urgent',
      status: 'overdue',
      dueDate: new Date(now - 1 * 86400000), // Due yesterday (Overdue!)
      department: 'IT',
      creator: admin._id,
      assignee: amit._id,
      source: 'manual',
      subtasks: [
        { title: 'Analyze slow query logs', completed: true },
        { title: 'Create compound indexes on Task schema', completed: true },
        { title: 'Benchmark response latency under load', completed: false },
      ],
      aiAnalysis: {
        suggestedPriority: 'urgent',
        reasoning: 'Task deadline has elapsed with incomplete subtasks. Marked overdue by system.',
        riskScore: 95,
        isOverdueRisk: true,
        analyzedAt: new Date(),
      },
    });

    const task4 = await Task.create({
      title: 'Organize Department Advisory Board Meeting',
      description: 'Prepare agenda slides, invite external industry experts, and reserve seminar hall.',
      priority: 'low',
      status: 'completed',
      dueDate: new Date(now - 3 * 86400000),
      completedAt: new Date(now - 2 * 86400000),
      department: 'Management',
      creator: admin._id,
      assignee: rahul._id,
      source: 'manual',
      subtasks: [
        { title: 'Finalize meeting agenda and presentation', completed: true },
        { title: 'Send invitation letters to industry members', completed: true },
        { title: 'Confirm logistics and catering arrangements', completed: true },
      ],
    });

    console.log('Created sample Tasks with diverse statuses and priorities.');

    // 3. Create Sample Email Draft (Ready for AI Review Screen demo!)
    await EmailDraft.create({
      messageId: 'sim-msg-102-draft',
      from: 'dean.academics@college.edu',
      subject: 'Urgent: Midterm Exam Paper Verification',
      body: 'Please ask Priya to verify the Midterm Question Papers for 6th semester CSE by tomorrow afternoon. This is urgent priority.',
      receivedAt: new Date(now - 7200000),
      extractedTask: {
        title: 'Verify Midterm Question Papers for 6th Semester CSE',
        description: 'Auto-extracted from Dean Academics email request for urgent paper verification.',
        assigneeName: 'Priya Patel',
        matchedUserId: priya._id,
        priority: 'urgent',
        dueDate: new Date(now + 1 * 86400000),
        department: 'CSE',
        confidence: 0.95,
        aiExplanation: 'Detected action "verify question papers" for Priya with deadline tomorrow and marked urgent.',
        suggestedSubtasks: [
          { title: 'Check question paper syllabus alignment' },
          { title: 'Verify Bloom taxonomy distribution' },
          { title: 'Sign off and submit to exam controller' },
        ],
      },
      status: 'pending_review',
    });

    // 4. Create Activity Logs
    await ActivityLog.create([
      {
        user: admin._id,
        task: task1._id,
        action: 'EMAIL_DRAFT_APPROVED',
        details: 'Admin approved email task "Prepare BCS402 Course File" and assigned to Rahul Sharma',
        metadata: { source: 'gmail' },
      },
      {
        user: rahul._id,
        task: task1._id,
        action: 'UPDATED_STATUS',
        details: 'Rahul Sharma updated status to IN-PROGRESS and completed 2 subtasks',
      },
      {
        user: admin._id,
        task: task3._id,
        action: 'OVERDUE_ALERT_SENT',
        details: 'Task "Upgrade Staging Database" passed deadline. Overdue alert dispatched to Amit Tomar.',
      },
    ]);

    // 5. Create In-App Notifications
    await Notification.create([
      {
        recipient: rahul._id,
        title: 'New Task Assigned',
        message: 'You were assigned: "Prepare BCS402 Course File for NAAC Audit"',
        type: 'task_assigned',
        task: task1._id,
        read: false,
      },
      {
        recipient: priya._id,
        title: 'New Email Task Pending Review',
        message: 'Incoming email from Dean Academics regarding Midterm Question Papers',
        type: 'gmail_sync',
        read: false,
      },
      {
        recipient: amit._id,
        title: '⚠️ Task Overdue Alert',
        message: 'Task "Upgrade Staging Database & Apply Indexing" is overdue! Please update status.',
        type: 'overdue_alert',
        task: task3._id,
        read: false,
      },
    ]);

    console.log('Database successfully seeded with realistic sample data!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
