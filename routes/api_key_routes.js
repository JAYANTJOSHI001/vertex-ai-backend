const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/api_key_controller');
const { authenticate } = require('../middleware/auth_middleware');

// All routes require authentication
router.use(authenticate);

// Create a new API key
router.post('/', apiKeyController.createAPIKey);

// Get all API keys for the authenticated user
router.get('/my-keys', apiKeyController.getMyAPIKeys);

// Get API key details
router.get('/:id', apiKeyController.getAPIKeyById);

// Revoke an API key
router.patch('/:id/revoke', apiKeyController.revokeAPIKey);

// Get API keys for a specific model (for model developers)
router.get('/model/:model_id', apiKeyController.getAPIKeysForModel);

module.exports = router;