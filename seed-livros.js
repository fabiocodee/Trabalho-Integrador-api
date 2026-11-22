// Popula o banco com categorias, autores e livros de exemplo.
// Uso: node seed-livros.js   (pode rodar mais de uma vez: não duplica)
require('dotenv').config();
const { sequelize, Category, Author, Book } = require('./models');

const authors = {
  'Machado de Assis': ['Brasileiro', '1839-06-21'],
  'Clarice Lispector': ['Brasileira', '1920-12-10'],
  'Jorge Amado': ['Brasileiro', '1912-08-10'],
  'Graciliano Ramos': ['Brasileiro', '1892-10-27'],
  'José de Alencar': ['Brasileiro', '1829-05-01'],
  'Monteiro Lobato': ['Brasileiro', '1882-04-18'],
  'Carlos Drummond de Andrade': ['Brasileiro', '1902-10-31'],
  'George Orwell': ['Britânico', '1903-06-25'],
  'J.R.R. Tolkien': ['Britânico', '1892-01-03'],
  'Agatha Christie': ['Britânica', '1890-09-15'],
  'Antoine de Saint-Exupéry': ['Francês', '1900-06-29'],
  'Gabriel García Márquez': ['Colombiano', '1927-03-06'],
  'Isaac Asimov': ['Americano', '1920-01-02'],
  'Franz Kafka': ['Tcheco', '1883-07-03'],
  'Jane Austen': ['Britânica', '1775-12-16'],
};

const categories = {
  Romance: 'Romances nacionais e estrangeiros',
  Poesia: 'Poemas e antologias',
  Infantil: 'Literatura infantojuvenil',
  'Ficção Científica': 'Ficção científica e distopias',
  Fantasia: 'Fantasia e aventura',
  Mistério: 'Policial e suspense',
  Clássicos: 'Clássicos da literatura mundial',
};

// [título, autor, categoria, ano, exemplares]
const books = [
  ['Dom Casmurro', 'Machado de Assis', 'Romance', 1899, 4],
  ['Memórias Póstumas de Brás Cubas', 'Machado de Assis', 'Romance', 1881, 3],
  ['A Hora da Estrela', 'Clarice Lispector', 'Romance', 1977, 3],
  ['Gabriela, Cravo e Canela', 'Jorge Amado', 'Romance', 1958, 2],
  ['Vidas Secas', 'Graciliano Ramos', 'Romance', 1938, 4],
  ['O Guarani', 'José de Alencar', 'Romance', 1857, 2],
  ['Reinações de Narizinho', 'Monteiro Lobato', 'Infantil', 1931, 5],
  ['Antologia Poética', 'Carlos Drummond de Andrade', 'Poesia', 1962, 3],
  ['1984', 'George Orwell', 'Ficção Científica', 1949, 5],
  ['A Revolução dos Bichos', 'George Orwell', 'Clássicos', 1945, 4],
  ['O Hobbit', 'J.R.R. Tolkien', 'Fantasia', 1937, 4],
  ['A Sociedade do Anel', 'J.R.R. Tolkien', 'Fantasia', 1954, 3],
  ['Assassinato no Expresso do Oriente', 'Agatha Christie', 'Mistério', 1934, 3],
  ['O Pequeno Príncipe', 'Antoine de Saint-Exupéry', 'Infantil', 1943, 5],
  ['Cem Anos de Solidão', 'Gabriel García Márquez', 'Romance', 1967, 3],
  ['Eu, Robô', 'Isaac Asimov', 'Ficção Científica', 1950, 2],
  ['A Metamorfose', 'Franz Kafka', 'Clássicos', 1915, 3],
  ['Orgulho e Preconceito', 'Jane Austen', 'Romance', 1813, 3],
];

// ISBN-13 de exemplo, com dígito verificador válido (não são os ISBNs reais das edições)
function isbn13(i) {
  const base = '978655' + String(100000 + i * 37);
  const sum = [...base].reduce((a, d, k) => a + Number(d) * (k % 2 ? 3 : 1), 0);
  return base + ((10 - (sum % 10)) % 10);
}

(async () => {
  await sequelize.sync();
  await require('./migrate')();

  const cat = {};
  for (const [name, description] of Object.entries(categories)) {
    [cat[name]] = await Category.findOrCreate({ where: { name }, defaults: { description } });
  }
  const aut = {};
  for (const [name, [nationality, birthDate]] of Object.entries(authors)) {
    [aut[name]] = await Author.findOrCreate({ where: { name }, defaults: { nationality, birthDate } });
  }

  let criados = 0;
  for (const [i, [title, author, category, year, copies]] of books.entries()) {
    const [book, created] = await Book.findOrCreate({
      where: { title },
      defaults: {
        isbn: isbn13(i), year, totalCopies: copies, availableCopies: copies, categoryId: cat[category].id,
      },
    });
    if (created) {
      await book.setAuthors([aut[author].id]);
      criados++;
    }
  }
  console.log(`Pronto: ${criados} livro(s) novo(s) cadastrado(s) de ${books.length}.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
