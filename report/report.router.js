const router = require('express').Router();
const controller = require('./report.controller');
const { authMiddleware, isAdmin } = require('../auth/auth.middleware');

router.get('/dashboard', authMiddleware, isAdmin, controller.dashboard);

module.exports = router;
