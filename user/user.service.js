const bcrypt = require('bcrypt');
const User = require('./user.model');
const RefreshToken = require('../auth/refreshToken.model');
const HttpError = require('../utils/httpError');

const strip = (user) => {
  const json = user.toJSON();
  delete json.password;
  return json;
};

const findByEmail = (email) => User.findOne({ where: { email } });
const findById = (id) => User.findByPk(id);

async function get(id) {
  const user = await User.findByPk(id);
  if (!user) throw new HttpError(404, 'Usuário não encontrado');
  return user;
}

const list = () => User.findAll({ attributes: { exclude: ['password'] }, order: [['name', 'ASC']] });

async function create({ name, username, email, password, isAdmin, active }) {
  if (!password || String(password).length < 6) {
    throw new HttpError(400, 'A senha deve ter ao menos 6 caracteres');
  }
  const user = await User.create({
    name, username, email,
    password: await bcrypt.hash(String(password), 10),
    isAdmin: !!isAdmin,
    active: active === undefined ? true : !!active,
  });
  return strip(user);
}

async function update(id, data) {
  const user = await get(id);
  const fields = {};
  for (const key of ['name', 'username', 'email', 'isAdmin']) {
    if (data[key] !== undefined) fields[key] = data[key];
  }
  if (data.password) {
    if (String(data.password).length < 6) throw new HttpError(400, 'A senha deve ter ao menos 6 caracteres');
    fields.password = await bcrypt.hash(String(data.password), 10);
  }
  await user.update(fields);
  return strip(user);
}

async function setActive(id, active, requesterId) {
  if (Number(id) === Number(requesterId) && !active) {
    throw new HttpError(409, 'Você não pode desativar a própria conta');
  }
  const user = await get(id);
  await user.update({ active: !!active });
  if (!active) await RefreshToken.update({ revoked: true }, { where: { userId: user.id } });
  return strip(user);
}

module.exports = { findByEmail, findById, list, create, update, setActive };
