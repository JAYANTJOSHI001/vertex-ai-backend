const express = require('express');
const router = express.Router();
const aiModelController = require('../controllers/ai_model_controller');
const { authenticate } = require('../middleware/auth_middleware');


router.get('/', aiModelController.getAllModels);
router.get('/:id', aiModelController.getModelById);


router.post('/', authenticate, aiModelController.createModel);
router.put('/:id', authenticate, aiModelController.updateModel);
router.delete('/:id', authenticate, aiModelController.deleteModel);
router.get('/developer/my-models', authenticate, aiModelController.getMyModels);
router.patch('/:id/status', authenticate, aiModelController.changeModelStatus);

module.exports = router;