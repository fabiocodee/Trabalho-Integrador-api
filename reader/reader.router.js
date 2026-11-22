const router = require('express').Router();
const controller = require('./reader.controller');
const { authMiddleware } = require('../auth/auth.middleware');

router.use(authMiddleware);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.get('/:id/loans', controller.loans);

module.exports = router;
