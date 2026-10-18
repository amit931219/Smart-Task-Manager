const express = require('express');
const {
  syncInbox,
  simulateEmail,
  getDrafts,
  approveDraft,
  rejectDraft,
  getStatus,
} = require('../controllers/gmailController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/status', getStatus);
router.post('/sync', syncInbox);
router.post('/simulate', simulateEmail);
router.get('/drafts', getDrafts);
router.post('/drafts/:id/approve', approveDraft);
router.post('/drafts/:id/reject', rejectDraft);

module.exports = router;
