const { Category, Book } = require('../models');
const HttpError = require('../utils/httpError');

const list = () => Category.findAll({ order: [['name', 'ASC']] });

async function get(id) {
  const category = await Category.findByPk(id);
  if (!category) throw new HttpError(404, 'Categoria não encontrada');
  return category;
}

const create = (d) => Category.create({ name: d.name, description: d.description });

async function update(id, d) {
  const category = await get(id);
  return category.update({ name: d.name ?? category.name, description: d.description ?? category.description });
}

async function remove(id) {
  const category = await get(id);
  const total = await Book.count({ where: { categoryId: id } });
  if (total > 0) throw new HttpError(409, `Não é possível excluir: a categoria possui ${total} livro(s) vinculado(s)`);
  await category.destroy();
}

module.exports = { list, get, create, update, remove };
