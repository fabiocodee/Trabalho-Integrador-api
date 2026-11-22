const { Op } = require('sequelize');
const { Reader, Loan, Book } = require('../models');
const HttpError = require('../utils/httpError');
const { serialize } = require('../loan/loan.service');

async function list(q = {}) {
  const where = {};
  if (q.name) where.name = { [Op.like]: `%${q.name}%` };
  if (q.cpf) where.cpf = { [Op.like]: `%${q.cpf}%` };
  return Reader.findAll({ where, order: [['name', 'ASC']] });
}

async function get(id) {
  const reader = await Reader.findByPk(id);
  if (!reader) throw new HttpError(404, 'Leitor não encontrado');
  return reader;
}

const create = (d) => Reader.create({ name: d.name, cpf: d.cpf, email: d.email, phone: d.phone });

async function update(id, d) {
  const reader = await get(id);
  const fields = {};
  for (const key of ['name', 'cpf', 'email', 'phone']) {
    if (d[key] !== undefined) fields[key] = d[key];
  }
  return reader.update(fields);
}

async function loans(id) {
  await get(id);
  const rows = await Loan.findAll({
    where: { readerId: id },
    include: [{ model: Book, attributes: ['id', 'title', 'isbn', 'coverUrl'] }],
    order: [['loanDate', 'DESC']],
  });
  return rows.map(serialize);
}

module.exports = { list, get, create, update, loans };
