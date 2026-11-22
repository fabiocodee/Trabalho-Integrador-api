const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const userService = require('../user/user.service');
const RefreshToken = require('./refreshToken.model');
const HttpError = require('../utils/httpError');

const REFRESH_DAYS = 7;
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, isAdmin: u.isAdmin });

function generateAccessToken(user) {
  return jwt.sign(publicUser(user), process.env.JWT_SECRET, { expiresIn: '15m' });
}

async function generateRefreshToken(user) {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ token, userId: user.id, expiresAt });
  return token;
}

async function issueTokens(user) {
  return { accessToken: generateAccessToken(user), refreshToken: await generateRefreshToken(user) };
}

async function login(email, password) {
  const user = email ? await userService.findByEmail(email) : null;
  if (!user) throw new HttpError(401, 'E-mail ou senha inválidos');
  const isMatch = await bcrypt.compare(String(password || ''), user.password);
  if (!isMatch) throw new HttpError(401, 'E-mail ou senha inválidos');
  if (!user.active) throw new HttpError(401, 'Conta desativada ou aguardando aprovação do administrador');

  return { ...(await issueTokens(user)), user: publicUser(user) };
}

async function refresh(refreshToken) {
  const stored = refreshToken ? await RefreshToken.findOne({ where: { token: refreshToken } }) : null;
  if (!stored) throw new HttpError(401, 'Refresh token inválido');

  // reuso de token já revogado: possível roubo, revoga todos os tokens do usuário
  if (stored.revoked) {
    await RefreshToken.update({ revoked: true }, { where: { userId: stored.userId } });
    throw new HttpError(401, 'Reuso de refresh token detectado');
  }
  if (stored.expiresAt < new Date()) throw new HttpError(401, 'Refresh token expirado');

  const user = await userService.findById(stored.userId);
  if (!user || !user.active) throw new HttpError(401, 'Usuário desativado');

  // rotação: revoga o antigo e emite um novo par
  stored.revoked = true;
  await stored.save();
  return { ...(await issueTokens(user)), user: publicUser(user) };
}

// Cadastro público: cria atendente DESATIVADO (nunca admin); o administrador aprova depois
async function register({ name, username, email, password }) {
  if (!name || !username || !email) throw new HttpError(400, 'Nome, usuário e e-mail são obrigatórios');
  await userService.create({ name, username, email, password, isAdmin: false, active: false });
  return { message: 'Cadastro recebido! Aguarde a aprovação do administrador para entrar.' };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  await RefreshToken.update({ revoked: true }, { where: { token: refreshToken } });
}

async function me(id) {
  const user = await userService.findById(id);
  if (!user || !user.active) throw new HttpError(401, 'Usuário não encontrado ou desativado');
  return publicUser(user);
}

module.exports = { login, register, refresh, logout, me };
