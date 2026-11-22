const service = require('./loan.service');

exports.create = async (req, res) => res.status(201).json(await service.create(req.body ?? {}, req.user.id));
exports.giveBack = async (req, res) => res.json(await service.giveBack(req.params.id));
exports.list = async (req, res) => res.json(await service.list(req.query.status));
exports.get = async (req, res) => res.json(await service.get(req.params.id));
