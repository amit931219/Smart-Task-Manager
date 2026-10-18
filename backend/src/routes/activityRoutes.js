const express = require('express');
const { getActivityLogs } = require('../controllers/activityController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', getActivityLogs);

module.exports = router;

