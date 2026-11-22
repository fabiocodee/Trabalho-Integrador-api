const router = require('express').Router();
const controller = require('./user.controller');
const { authMiddleware, isAdmin } = require('../auth/auth.middleware');

router.use(authMiddleware, isAdmin);
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.patch('/:id/active', controller.setActive);

module.exports = router;
