# jwt-api — Sistema de Biblioteca

API em Node.js + Express 5 + Sequelize + SQLite + JWT.

## Instalação
```
npm install
copy .envex .env        # Windows (Linux/Mac: cp .envex .env)
npm start
```
Se existir um `database.sqlite` de versões antigas, apague-o antes (o Sequelize não altera tabelas existentes).
O `.env` fica fora do repositório; só o `.envex` é versionado.

## Variáveis de ambiente (`.envex`)
| Variável | Uso |
|---|---|
| JWT_SECRET | assina o access token |
| JWT_REFRESH_SECRET | reservada (o refresh é uma string aleatória, `crypto.randomBytes`) |
| PORT | porta da API (3000) |
| CORS_ORIGIN | origens do front permitidas, separadas por vírgula |
| ADMIN_NAME / ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD | admin criado pelo seed |

## Usuário admin do seed
Criado na primeira execução, se não houver nenhum admin: **admin@biblioteca.com / 123456**
(troque no `.env` antes da primeira subida em qualquer ambiente real).

## Estrutura
`auth/ user/ category/ author/ book/ reader/ loan/ report/` — cada um com router → controller → service → model.
Associações em `models/index.js` (Categoria 1:N Livro, Livro N:N Autor via BookAuthor, Leitor/Livro/User 1:N Empréstimo).

## Decisões
- **Access token:** JWT de 15 min (`id, name, email, isAdmin`). Inválido/expirado → 401; atendente em rota de admin → 403.
- **Refresh token:** string aleatória de 7 dias, salva em `RefreshTokens`. `/auth/refresh` faz rotação (revoga o antigo);
  reuso de um token já revogado revoga todos os tokens do usuário (detecção de roubo).
- **`logout_list` removida:** o access token dura 15 min e o logout revoga o refresh token no banco, então a sessão não
  renova. Uma blacklist de access tokens exigiria consulta a cada requisição e iria contra o modelo stateless.
  Risco residual: o access token continua válido até 15 min após o logout.
- **`POST /v1/user` agora é só para admin.** Foi adicionado `POST /v1/auth/register` (cadastro público) que cria o
  atendente **desativado e nunca admin**; o administrador o ativa em `PATCH /v1/user/:id/active`.
- **Prazo do empréstimo:** `POST /v1/loans` aceita `days` (1 a 30); sem ele vale o padrão de 7 dias.
- **Capas:** `Book.coverUrl` (opcional). O front busca a capa na Open Library quando está vazia e usa uma capa gerada
  como reserva. `migrate.js` adiciona a coluna em bancos antigos.
- **Empréstimo/devolução** usam `sequelize.transaction`. Status ATRASADO é calculado na leitura (`dueDate < agora` e sem
  `returnDate`). Multa de R$ 1,00 por dia (arredondando para cima) gravada em `fine` na devolução.
- **Exclusões** de categoria, autor e livro com vínculos retornam **409** com mensagem. Livro com histórico de
  empréstimos também não é excluído (preserva o histórico).
- Atendente desativado não faz login, e seus refresh tokens são revogados ao desativar.

## Testes manuais
Importe `biblioteca.postman_collection.json` no Insomnia ou no Postman. Rode primeiro **Auth → Login admin**:
os tokens são salvos nas variáveis da coleção.
