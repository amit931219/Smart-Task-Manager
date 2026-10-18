const express = require('express');
const { z } = require('zod');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  toggleSubtask,
  addSubtask,
  deleteTask,
  triggerOverdueCheck,
} = require('../controllers/taskController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title is required'),
    description: z.string().optional(),
    dueDate: z.string().or(z.date()),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    department: z.string().optional(),
    assignee: z.string().min(1, 'Assignee is required'),
    subtasks: z
      .array(
        z.object({
          title: z.string(),
          completed: z.boolean().optional(),
          suggestedByAI: z.boolean().optional(),
        })
      )
      .optional(),
  }),
});

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(validate(createTaskSchema), createTask);

router.post('/check-overdue', triggerOverdueCheck);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/status', updateTaskStatus);
router.post('/:id/subtasks', addSubtask);
router.patch('/:id/subtasks/:subtaskId', toggleSubtask);

module.exports = router;

