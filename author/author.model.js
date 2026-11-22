const { DataTypes } = require('sequelize');
const db = require('../config/db');

module.exports = db.define('Author', {
  name: { type: DataTypes.STRING, allowNull: false },
  nationality: { type: DataTypes.STRING },
  birthDate: { type: DataTypes.DATEONLY },
});
