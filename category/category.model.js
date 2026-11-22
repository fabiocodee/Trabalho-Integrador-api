const { DataTypes } = require('sequelize');
const db = require('../config/db');

module.exports = db.define('Category', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.STRING },
});
