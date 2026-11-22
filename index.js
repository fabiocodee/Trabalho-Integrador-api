require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const seed = require('./seed');

const app = express();

const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)),
  credentials: true,
}));
app.use(express.json());

app.use('/v1/auth', require('./auth/auth.router'));
app.use('/v1/user', require('./user/user.router'));
app.use('/v1/categories', require('./category/category.router'));
app.use('/v1/authors', require('./author/author.router'));
app.use('/v1/books', require('./book/book.router'));
app.use('/v1/readers', require('./reader/reader.router'));
app.use('/v1/loans', require('./loan/loan.router'));
app.use('/v1/reports', require('./report/report.router'));

app.use((req, res) => res.status(404).json({ message: 'Rota não encontrada' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = Object.keys(err.fields || {}).join(', ');
    return res.status(409).json({ message: `Já existe um registro com este valor (${fields})` });
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ message: err.errors.map((e) => e.message).join('; ') });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ message: 'Referência inválida (registro relacionado não existe)' });
  }
  console.error(err);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
(async () => {
  await sequelize.sync();
  await require('./migrate')();
  await seed();
  app.listen(PORT, () => console.log(`SERVIDOR RODANDO http://localhost:${PORT}`));
})();
