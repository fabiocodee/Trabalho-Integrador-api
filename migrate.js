const { DataTypes } = require('sequelize');
const { sequelize } = require('./models');

// Adiciona colunas novas em bancos já existentes (o sync() não altera tabelas prontas)
module.exports = async function migrate() {
  const qi = sequelize.getQueryInterface();
  const books = await qi.describeTable('Books');
  if (!books.coverUrl) {
    await qi.addColumn('Books', 'coverUrl', { type: DataTypes.STRING(500), allowNull: true });
    console.log('Migração: coluna Books.coverUrl criada');
  }
};
