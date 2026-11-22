const { DataTypes } = require('sequelize');
const db = require('../config/db');

module.exports = db.define('Book', {
  title: { type: DataTypes.STRING, allowNull: false },
  isbn: { type: DataTypes.STRING, allowNull: false, unique: true },
  year: { type: DataTypes.INTEGER },
  coverUrl: { type: DataTypes.STRING(500), allowNull: true },
  totalCopies: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 0 } },
  availableCopies: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 0 } },
});
