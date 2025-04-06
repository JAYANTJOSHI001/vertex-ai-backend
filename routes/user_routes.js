const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');
const { authenticate, isAdmin } = require('../middleware/auth_middleware');

router.post('/register', userController.register);
router.post('/login', userController.login);

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/change-password', authenticate, userController.changePassword);
router.delete('/delete', authenticate, userController.deleteUser);

router.get('/all', authenticate, isAdmin, userController.getAllUsers);

module.exports = router;