const express = require('express');
const router = express.Router();
const apiUsageController = require('../controllers/api_usage_controller');
const { authenticate } = require('../middleware/auth_middleware');

// All routes require authentication
router.use(authenticate);

router.get('/key/:id', apiUsageController.getAPIKeyUsageLogs);
router.get('/model/:model_id', apiUsageController.getModelUsageLogs);
router.get('/my-usage', apiUsageController.getUserUsageLogs);
router.get('/developer/stats', apiUsageController.getDeveloperStats);

module.exports = router;