const { Op } = require('sequelize');
const { Book, Loan } = require('../models');

async function dashboard() {
  const now = new Date();
  const [totalBooks, totalCopies, activeLoans, overdueLoans, totalFines] = await Promise.all([
    Book.count(),
    Book.sum('totalCopies'),
    Loan.count({ where: { returnDate: null, dueDate: { [Op.gte]: now } } }),
    Loan.count({ where: { returnDate: null, dueDate: { [Op.lt]: now } } }),
    Loan.sum('fine'),
  ]);
  return {
    totalBooks,
    totalCopies: totalCopies || 0,
    activeLoans,
    overdueLoans,
    onLoan: activeLoans + overdueLoans,
    totalFines: totalFines || 0,
  };
}

module.exports = { dashboard };
