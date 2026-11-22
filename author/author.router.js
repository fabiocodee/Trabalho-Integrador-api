const router = require('express').Router();
const controller = require('./author.controller');
const { authMiddleware, isAdmin } = require('../auth/auth.middleware');

router.use(authMiddleware);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', isAdmin, controller.create);
router.put('/:id', isAdmin, controller.update);
router.delete('/:id', isAdmin, controller.remove);

module.exports = router;
