const service = require('./user.service');

exports.list = async (req, res) => res.json(await service.list());
exports.create = async (req, res) => res.status(201).json(await service.create(req.body ?? {}));
exports.update = async (req, res) => res.json(await service.update(req.params.id, req.body ?? {}));
exports.setActive = async (req, res) => {
  const { active } = req.body ?? {};
  res.json(await service.setActive(req.params.id, active, req.user.id));
};
