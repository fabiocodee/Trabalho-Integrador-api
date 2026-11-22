const { DataTypes } = require('sequelize');
const db = require('../config/db');

module.exports = db.define('Loan', {
  loanDate: { type: DataTypes.DATE, allowNull: false },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  returnDate: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.ENUM('ATIVO', 'DEVOLVIDO', 'ATRASADO'), allowNull: false, defaultValue: 'ATIVO' },
  fine: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
});
