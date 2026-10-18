const express = require('express');
const {
  parseEmail,
  generateSubtasks,
  checkPriorityAndDeadline,
  generateSummary,
} = require('../controllers/aiController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.post('/parse-email', parseEmail);
router.post('/subtasks', generateSubtasks);
router.post('/priority-deadline-check', checkPriorityAndDeadline);
router.post('/summary', generateSummary);

module.exports = router;

