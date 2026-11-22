const service = require('./reader.service');

exports.list = async (req, res) => res.json(await service.list(req.query));
exports.get = async (req, res) => res.json(await service.get(req.params.id));
exports.create = async (req, res) => res.status(201).json(await service.create(req.body ?? {}));
exports.update = async (req, res) => res.json(await service.update(req.params.id, req.body ?? {}));
exports.loans = async (req, res) => res.json(await service.loans(req.params.id));
