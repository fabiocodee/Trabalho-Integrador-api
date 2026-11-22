const { Author, BookAuthor } = require('../models');
const HttpError = require('../utils/httpError');

const list = () => Author.findAll({ order: [['name', 'ASC']] });

async function get(id) {
  const author = await Author.findByPk(id);
  if (!author) throw new HttpError(404, 'Autor não encontrado');
  return author;
}

const create = (d) => Author.create({ name: d.name, nationality: d.nationality, birthDate: d.birthDate });

async function update(id, d) {
  const author = await get(id);
  return author.update({
    name: d.name ?? author.name,
    nationality: d.nationality ?? author.nationality,
    birthDate: d.birthDate ?? author.birthDate,
  });
}

async function remove(id) {
  const author = await get(id);
  const total = await BookAuthor.count({ where: { authorId: id } });
  if (total > 0) throw new HttpError(409, `Não é possível excluir: o autor possui ${total} livro(s) vinculado(s)`);
  await author.destroy();
}

module.exports = { list, get, create, update, remove };
