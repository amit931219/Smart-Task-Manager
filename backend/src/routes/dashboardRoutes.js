const express = require('express');
const { getDashboardMetrics } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', getDashboardMetrics);

module.exports = router;
