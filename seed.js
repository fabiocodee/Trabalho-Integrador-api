const bcrypt = require('bcrypt');
const { User } = require('./models');

module.exports = async function seed() {
  const hasAdmin = await User.findOne({ where: { isAdmin: true } });
  if (hasAdmin) return;
  await User.create({
    name: process.env.ADMIN_NAME || 'Admin',
    username: process.env.ADMIN_USERNAME || 'admin',
    email: process.env.ADMIN_EMAIL || 'admin@biblioteca.com',
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD || '123456', 10),
    isAdmin: true,
    active: true,
  });
  console.log('Seed: administrador inicial criado');
};
