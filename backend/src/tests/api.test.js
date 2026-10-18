const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

let adminToken = '';
let employeeToken = '';

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_task_manager';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Login as admin
  const resAdmin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@smarttask.com', password: 'password123' });
  adminToken = resAdmin.body.data.token;

  // Login as employee
  const resEmp = await request(app)
    .post('/api/auth/login')
    .send({ email: 'rahul@smarttask.com', password: 'password123' });
  employeeToken = resEmp.body.data.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Smart Task Manager API Suite', () => {
  test('GET /api/health should return status healthy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('healthy');
  });

  test('POST /api/auth/login with valid credentials should return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@smarttask.com', password: 'password123' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.role).toBe('admin');
  });

  test('GET /api/tasks with auth should return tasks array', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/ai/parse-email should extract structured task fields', async () => {
    const emailSample = {
      subject: 'BCS402 Course File Preparation',
      body: 'Please ask Rahul to prepare the BCS402 course file by Monday. This is high priority.',
    };

    const res = await request(app)
      .post('/api/ai/parse-email')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(emailSample);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.assigneeName).toBe('Rahul Sharma');
    expect(res.body.data.dueDate).toBeDefined();
  });

  test('POST /api/ai/subtasks should return suggested subtasks array', async () => {
    const res = await request(app)
      .post('/api/ai/subtasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ taskTitle: 'Prepare the annual department report' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/dashboard should return metrics and breakdowns', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics.totalTasks).toBeGreaterThan(0);
    expect(res.body.data.statusDistribution).toBeDefined();
  });

  test('GET /api/gmail/drafts should return pending drafts', async () => {
    const res = await request(app)
      .get('/api/gmail/drafts?status=all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
