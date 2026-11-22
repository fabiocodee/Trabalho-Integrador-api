// Cadastra leitores de exemplo, alguns com pendências (atraso e multa).
// Requer: ter rodado antes `node seed-livros.js` e ter um admin (criado ao iniciar a API).
// Uso: node seed-leitores.js   (não duplica leitores já cadastrados)
require('dotenv').config();
const { sequelize, User, Book, Reader, Loan } = require('./models');

const DAY = 24 * 60 * 60 * 1000;

// CPF de exemplo com dígitos verificadores válidos (fictício)
function cpf(i) {
  const base = String(100000000 + i * 7919).slice(0, 9).split('').map(Number);
  const dv = (arr) => {
    const s = arr.reduce((a, d, k) => a + d * (arr.length + 1 - k), 0);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = dv(base);
  const d2 = dv([...base, d1]);
  return [...base, d1, d2].join('');
}

// loans: [título, emprestado há N dias, devolvido há N dias | null (ainda com o leitor)]
const readers = [
  { name: 'Ana Paula Souza', phone: '44991110001', note: 'PENDÊNCIA: 2 livros atrasados',
    loans: [['Dom Casmurro', 20, null], ['1984', 12, null]] },
  { name: 'Bruno Lima', phone: '44991110002', note: 'PENDÊNCIA: 1 livro muito atrasado (23 dias)',
    loans: [['O Hobbit', 30, null], ['Vidas Secas', 45, 40]] },
  { name: 'Carla Mendes', phone: '44991110003', note: 'PENDÊNCIA: multa registrada (devolveu com atraso)',
    loans: [['A Hora da Estrela', 25, 10]] },
  { name: 'Diego Alves', phone: '44991110004', note: 'Limite de 3 empréstimos ativos atingido',
    loans: [['Reinações de Narizinho', 3, null], ['O Pequeno Príncipe', 2, null], ['A Revolução dos Bichos', 1, null]] },
  { name: 'Elisa Ferreira', phone: '44991110005', note: 'Em dia, 1 empréstimo ativo',
    loans: [['Cem Anos de Solidão', 3, null]] },
  { name: 'Felipe Costa', phone: '44991110006', note: 'Sem empréstimos', loans: [] },
  { name: 'Gabriela Rocha', phone: '44991110007', note: 'Em dia, devolveu no prazo',
    loans: [['Orgulho e Preconceito', 15, 10]] },
  { name: 'Henrique Dias', phone: '44991110008', note: 'PENDÊNCIA: 1 atrasado + multa de devolução antiga',
    loans: [['A Metamorfose', 16, null], ['Antologia Poética', 30, 20]] },
  { name: 'Isabela Martins', phone: '44991110009', note: 'Sem empréstimos', loans: [] },
  { name: 'João Pedro Nunes', phone: '44991110010', note: 'PENDÊNCIA: 1 livro atrasado (3 dias)',
    loans: [['Assassinato no Expresso do Oriente', 10, null]] },
];

(async () => {
  await sequelize.sync();
  await require('./migrate')();
  const admin = await User.findOne({ where: { isAdmin: true } });
  if (!admin) throw new Error('Nenhum administrador encontrado. Inicie a API uma vez (npm start) para o seed criar o admin.');
  if ((await Book.count()) === 0) throw new Error('Nenhum livro cadastrado. Rode antes: node seed-livros.js');

  const now = Date.now();
  let criados = 0;
  const avisos = [];

  for (const [i, r] of readers.entries()) {
    const number = cpf(i + 1);
    if (await Reader.findOne({ where: { cpf: number } })) continue;

    await sequelize.transaction(async (t) => {
      const reader = await Reader.create({
        name: r.name, cpf: number,
        email: `${r.name.split(' ')[0].toLowerCase()}@email.com`, phone: r.phone,
      }, { transaction: t });

      for (const [title, ago, ret] of r.loans) {
        const book = await Book.findOne({ where: { title }, transaction: t });
        if (!book) { avisos.push(`livro não encontrado: ${title}`); continue; }
        if (ret === null && book.availableCopies <= 0) { avisos.push(`sem exemplar disponível: ${title}`); continue; }

        const loanDate = new Date(now - ago * DAY);
        const dueDate = new Date(loanDate.getTime() + 7 * DAY);
        let returnDate = null;
        let fine = 0;
        if (ret !== null) {
          returnDate = new Date(now - ret * DAY);
          if (returnDate > dueDate) fine = Math.ceil((returnDate - dueDate) / DAY); // R$ 1,00 por dia
        }
        await Loan.create({
          bookId: book.id, readerId: reader.id, userId: admin.id,
          loanDate, dueDate, returnDate, fine, status: ret === null ? 'ATIVO' : 'DEVOLVIDO',
        }, { transaction: t });
        if (ret === null) {
          await Book.increment('availableCopies', { by: -1, where: { id: book.id }, transaction: t });
        }
      }
    });
    criados++;
    console.log(`+ ${r.name} — ${r.note}`);
  }

  console.log(`\nPronto: ${criados} leitor(es) novo(s) de ${readers.length}.`);
  avisos.forEach((a) => console.log('Aviso:', a));
  process.exit(0);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
