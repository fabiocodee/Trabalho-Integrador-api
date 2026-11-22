const sequelize = require('../config/db');
const User = require('../user/user.model');
const RefreshToken = require('../auth/refreshToken.model');
const Category = require('../category/category.model');
const Author = require('../author/author.model');
const Book = require('../book/book.model');
const Reader = require('../reader/reader.model');
const Loan = require('../loan/loan.model');

const BookAuthor = sequelize.define('BookAuthor', {}, { timestamps: false });

// Categoria 1:N Livro
Category.hasMany(Book, { foreignKey: { name: 'categoryId', allowNull: false } });
Book.belongsTo(Category, { foreignKey: { name: 'categoryId', allowNull: false } });

// Livro N:N Autor
Book.belongsToMany(Author, { through: BookAuthor, foreignKey: 'bookId', otherKey: 'authorId' });
Author.belongsToMany(Book, { through: BookAuthor, foreignKey: 'authorId', otherKey: 'bookId' });

// Emprestimo pertence a Livro, Leitor e User
Book.hasMany(Loan, { foreignKey: { name: 'bookId', allowNull: false } });
Loan.belongsTo(Book, { foreignKey: { name: 'bookId', allowNull: false } });
Reader.hasMany(Loan, { foreignKey: { name: 'readerId', allowNull: false } });
Loan.belongsTo(Reader, { foreignKey: { name: 'readerId', allowNull: false } });
User.hasMany(Loan, { foreignKey: { name: 'userId', allowNull: false } });
Loan.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false } });

// RefreshToken pertence a User
User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, RefreshToken, Category, Author, Book, BookAuthor, Reader, Loan };
