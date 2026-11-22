const { Op } = require('sequelize');
const { sequelize, Book, Author, Category, BookAuthor, Loan } = require('../models');
const HttpError = require('../utils/httpError');

const INCLUDE = [
  { model: Category },
  { model: Author, through: { attributes: [] } },
];

async function list(q = {}) {
  const where = {};
  if (q.title) where.title = { [Op.like]: `%${q.title}%` };
  if (q.categoryId) where.categoryId = q.categoryId;
  if (q.available === 'true') where.availableCopies = { [Op.gt]: 0 };

  if (q.authorId) {
    const links = await BookAuthor.findAll({ where: { authorId: q.authorId } });
    where.id = { [Op.in]: links.map((l) => l.bookId) };
  }
  return Book.findAll({ where, include: INCLUDE, order: [['title', 'ASC']] });
}

async function get(id) {
  const book = await Book.findByPk(id, { include: INCLUDE });
  if (!book) throw new HttpError(404, 'Livro não encontrado');
  return book;
}

async function create(d) {
  const total = d.totalCopies === undefined ? 1 : Number(d.totalCopies);
  if (!Number.isInteger(total) || total < 0) throw new HttpError(400, 'totalCopies inválido');

  const id = await sequelize.transaction(async (t) => {
    const book = await Book.create({
      title: d.title, isbn: d.isbn, year: d.year, categoryId: d.categoryId, coverUrl: d.coverUrl || null,
      totalCopies: total, availableCopies: total,
    }, { transaction: t });
    if (Array.isArray(d.authorIds)) await book.setAuthors(d.authorIds, { transaction: t });
    return book.id;
  });
  return get(id);
}

async function update(id, d) {
  const book = await Book.findByPk(id);
  if (!book) throw new HttpError(404, 'Livro não encontrado');

  const fields = {};
  for (const key of ['title', 'isbn', 'year', 'categoryId']) {
    if (d[key] !== undefined) fields[key] = d[key];
  }
  if (d.coverUrl !== undefined) fields.coverUrl = d.coverUrl || null;
  if (d.totalCopies !== undefined) {
    const total = Number(d.totalCopies);
    const loaned = book.totalCopies - book.availableCopies;
    if (!Number.isInteger(total) || total < loaned) {
      throw new HttpError(409, `totalCopies não pode ser menor que ${loaned} (exemplares emprestados)`);
    }
    fields.totalCopies = total;
    fields.availableCopies = total - loaned;
  }

  await sequelize.transaction(async (t) => {
    await book.update(fields, { transaction: t });
    if (Array.isArray(d.authorIds)) await book.setAuthors(d.authorIds, { transaction: t });
  });
  return get(id);
}

async function remove(id) {
  const book = await Book.findByPk(id);
  if (!book) throw new HttpError(404, 'Livro não encontrado');

  const active = await Loan.count({ where: { bookId: id, returnDate: null } });
  if (active > 0) throw new HttpError(409, `Não é possível excluir: o livro possui ${active} empréstimo(s) ativo(s)`);
  const history = await Loan.count({ where: { bookId: id } });
  if (history > 0) throw new HttpError(409, 'Não é possível excluir: o livro possui histórico de empréstimos');

  await sequelize.transaction(async (t) => {
    await BookAuthor.destroy({ where: { bookId: id }, transaction: t });
    await book.destroy({ transaction: t });
  });
}

module.exports = { list, get, create, update, remove };
