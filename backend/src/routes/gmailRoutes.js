const express = require('express');
const {
  syncInbox,
  simulateEmail,
  getDrafts,
  approveDraft,
  rejectDraft,
  getStatus,
  getAuthUrl,
  oauth2Callback,
  updateGmailConfig,
  downloadAttachment,
} = require('../controllers/gmailController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Public routes for Google OAuth2 handshake & attachment downloads
router.get('/oauth2callback', oauth2Callback);
router.get('/auth-url', getAuthUrl);
router.get('/attachments/:filename', downloadAttachment);

// Protected routes
router.use(protect);

router.get('/status', getStatus);
router.post('/config', updateGmailConfig);
router.post('/sync', syncInbox);
router.post('/simulate', simulateEmail);
router.get('/drafts', getDrafts);
router.post('/drafts/:id/approve', approveDraft);
router.post('/drafts/:id/reject', rejectDraft);

module.exports = router;

