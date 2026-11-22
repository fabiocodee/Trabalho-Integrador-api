const router = require('express').Router();
const controller = require('./loan.controller');
const { authMiddleware } = require('../auth/auth.middleware');

router.use(authMiddleware);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.patch('/:id/return', controller.giveBack);

module.exports = router;
