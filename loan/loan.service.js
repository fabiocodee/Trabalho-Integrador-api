const { Op } = require('sequelize');
const { sequelize, Loan, Book, Reader, User } = require('../models');
const HttpError = require('../utils/httpError');

const DAY = 24 * 60 * 60 * 1000;
const LOAN_DAYS = 7;      // prazo padrão
const MAX_LOAN_DAYS = 30; // prazo máximo permitido
const MAX_ACTIVE = 3;
const FINE_PER_DAY = 1;

function computeStatus(loan) {
  if (loan.returnDate) return 'DEVOLVIDO';
  return new Date(loan.dueDate) < new Date() ? 'ATRASADO' : 'ATIVO';
}

function serialize(loan) {
  const json = loan.toJSON();
  json.status = computeStatus(json);
  return json;
}

const INCLUDE = [
  { model: Book, attributes: ['id', 'title', 'isbn', 'coverUrl'] },
  { model: Reader, attributes: ['id', 'name', 'cpf'] },
  { model: User, attributes: ['id', 'name'] },
];

async function create({ bookId, readerId, days }, userId) {
  if (!bookId || !readerId) throw new HttpError(400, 'bookId e readerId são obrigatórios');

  const loanDays = days === undefined || days === null || days === '' ? LOAN_DAYS : Number(days);
  if (!Number.isInteger(loanDays) || loanDays < 1 || loanDays > MAX_LOAN_DAYS) {
    throw new HttpError(400, `O prazo deve ser de 1 a ${MAX_LOAN_DAYS} dias`);
  }

  const id = await sequelize.transaction(async (t) => {
    const book = await Book.findByPk(bookId, { transaction: t });
    if (!book) throw new HttpError(404, 'Livro não encontrado');
    const reader = await Reader.findByPk(readerId, { transaction: t });
    if (!reader) throw new HttpError(404, 'Leitor não encontrado');

    if (book.availableCopies <= 0) throw new HttpError(409, 'Não há exemplares disponíveis deste livro');

    const now = new Date();
    const overdue = await Loan.count({
      where: { readerId, returnDate: null, dueDate: { [Op.lt]: now } },
      transaction: t,
    });
    if (overdue > 0) throw new HttpError(409, 'O leitor possui empréstimo(s) em atraso');

    const active = await Loan.count({ where: { readerId, returnDate: null }, transaction: t });
    if (active >= MAX_ACTIVE) throw new HttpError(409, `O leitor já possui ${MAX_ACTIVE} empréstimos ativos`);

    const loan = await Loan.create({
      bookId, readerId, userId,
      loanDate: now,
      dueDate: new Date(now.getTime() + loanDays * DAY),
      status: 'ATIVO',
    }, { transaction: t });

    await Book.increment('availableCopies', { by: -1, where: { id: bookId }, transaction: t });
    return loan.id;
  });
  return get(id);
}

async function giveBack(id) {
  await sequelize.transaction(async (t) => {
    const loan = await Loan.findByPk(id, { transaction: t });
    if (!loan) throw new HttpError(404, 'Empréstimo não encontrado');
    if (loan.returnDate) throw new HttpError(409, 'Este empréstimo já foi devolvido');

    const now = new Date();
    let fine = 0;
    if (now > loan.dueDate) fine = Math.ceil((now - loan.dueDate) / DAY) * FINE_PER_DAY;

    await loan.update({ returnDate: now, status: 'DEVOLVIDO', fine }, { transaction: t });
    await Book.increment('availableCopies', { by: 1, where: { id: loan.bookId }, transaction: t });
  });
  return get(id);
}

async function get(id) {
  const loan = await Loan.findByPk(id, { include: INCLUDE });
  if (!loan) throw new HttpError(404, 'Empréstimo não encontrado');
  return serialize(loan);
}

async function list(status) {
  const now = new Date();
  const where = {};
  if (status === 'ATIVO') Object.assign(where, { returnDate: null, dueDate: { [Op.gte]: now } });
  else if (status === 'ATRASADO') Object.assign(where, { returnDate: null, dueDate: { [Op.lt]: now } });
  else if (status === 'DEVOLVIDO') where.returnDate = { [Op.ne]: null };
  else if (status) throw new HttpError(400, 'status deve ser ATIVO, ATRASADO ou DEVOLVIDO');

  const rows = await Loan.findAll({ where, include: INCLUDE, order: [['loanDate', 'DESC']] });
  return rows.map(serialize);
}

module.exports = { create, giveBack, get, list, serialize, computeStatus };
