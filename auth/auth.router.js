const router = require('express').Router();
const controller = require('./auth.controller');
const { authMiddleware } = require('./auth.middleware');

router.post('/login', controller.login);
router.post('/register', controller.register);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', authMiddleware, controller.me);

module.exports = router;
