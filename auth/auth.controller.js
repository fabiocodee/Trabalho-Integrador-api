const service = require('./auth.service');

exports.login = async (req, res) => {
  const { email, password } = req.body ?? {};
  res.json(await service.login(email, password));
};
exports.register = async (req, res) => res.status(201).json(await service.register(req.body ?? {}));
exports.refresh = async (req, res) => res.json(await service.refresh(req.body?.refreshToken));
exports.logout = async (req, res) => {
  await service.logout(req.body?.refreshToken);
  res.status(204).end();
};
exports.me = async (req, res) => res.json(await service.me(req.user.id));
