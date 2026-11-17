# LPZ Training

Site do LPZ Training — congresso/treinamento de zouk. Divulgação do evento
(cronograma, professores, agenda), galeria de fotos e vídeos, e venda de
ingressos com pagamento online.

Ver `CLAUDE.md` para as diretrizes de segurança, escopo, LGPD e custo que
regem este projeto.

## Stack

- **Next.js (App Router) + TypeScript** — front-end e back-end no mesmo
  projeto (monólito modular).
- **PostgreSQL + Drizzle ORM** — banco relacional, migrations versionadas em
  `src/db/migrations/`.
- **Tailwind CSS v4** — estilos, tokens da identidade visual (petróleo/dourado/verde-água/laranja) em
  `src/app/globals.css`.
- **Mercado Pago (Checkout Pro)** — pagamento (ainda não implementado; ver
  `src/modules/pagamentos`, hoje só com o `FakePaymentProvider` de dev).
- **Fotos**: disco local via `StorageAdapter` (`src/modules/midia`).
  **Vídeos**: embed do YouTube (a implementar).
- Hospedagem alvo: VPS própria (Docker Compose), com Cloudflare na frente.

## Pré-requisitos

- Node.js 24+ e npm
- Docker Desktop (para Postgres e Mailpit local) — **ainda não instalado
  nesta máquina**; instale antes do primeiro `docker compose up`

## Como rodar localmente

1. Copie o arquivo de variáveis de ambiente:

   ```
   cp .env.example .env
   ```

2. Suba o banco de dados e o capturador de e-mail (Mailpit):

   ```
   docker compose up db mailpit
   ```

3. Em outro terminal, instale as dependências e rode as migrations:

   ```
   npm install
   npm run db:migrate
   npm run db:seed   # dados fictícios para desenvolvimento
   ```

4. Rode o site:

   ```
   npm run dev
   ```

   Acesse http://localhost:3000 (ou a porta usada no `next dev -p`). Os e-mails
   capturados aparecem no próprio site, em `/emails` (ex: http://localhost:3000/emails
   — repasse para o Mailpit, só em desenvolvimento).

Alternativa: `docker compose up` (sem especificar serviços) sobe app + banco
+ mailpit inteiramente em containers — reproduz a topologia da VPS, mas o
hot reload tende a ser mais lento no Windows do que rodar `npm run dev` no
host.

`TEST_MODE=true` no `.env` (padrão) faz o checkout usar um provedor de
pagamento simulado (`FakePaymentProvider`), sem chamar o Mercado Pago.
**Nunca** desabilitar isso fora de um ambiente com o adapter real e
credenciais de sandbox/produção configuradas corretamente.

## Áreas do site

| Rota | Quem acessa | O que faz |
|---|---|---|
| `/` | todos | Apresentação, cronograma por dia, professores (com foto) e lote à venda |
| `/ingressos` | congressista logado | Compra: reserva uma vaga do lote vigente por 30 min e abre o pagamento |
| `/pagamento/simulado` | só com `TEST_MODE=true` | Faz o papel do Mercado Pago em dev (aprovar/recusar) |
| `/congressistas/minha-area` | congressista | Dados e ingresso com QR code + código curto de 8 caracteres |
| `/galeria` | todos | Fotos e vídeos (YouTube sem cookies) |
| `/administradores/usuarios` | organizador | Grade de usuários (forma de cadastro, compras por produto), detalhe no olhinho e exportação .xlsx com escolha de colunas |
| `/administradores/checkin` | organizador e portaria | Lê o QR pela câmera (Chrome/Android) ou busca por código/nome e confirma a entrada |
| `/financeiro` | organizador | Arrecadação, lotes (criar/editar/abrir/fechar), pedidos e exportação CSV |
| `/administradores/conteudo` | organizador | Professores (com foto) e cronograma |
| `/administradores/galeria` | organizador | Envio de fotos e vídeos |

Produtos à venda (`src/modules/ingressos/produtos.ts`): Full pass, Pacote de
bailes, Baile avulso, Paparazzi — vídeo e Paparazzi — fotos. Cada lote é de um
produto (criado em `/financeiro`). **Regra para novos desenvolvimentos:** todo
produto ou compra nova precisa aparecer na tela `/administradores/usuarios`
(coluna "Comprou", detalhe do usuário e exportação para Excel em
`src/modules/usuarios/colunas.ts`).

Regras de venda (`src/modules/ingressos`): um de cada produto por pessoa; a vaga é
reservada no pedido e devolvida se o pagamento não sair em 30 minutos; o
ingresso só é emitido depois de o status ser confirmado **consultando o
gateway**. No check-in o QR só localiza o ingresso — a entrada é validada no
banco (pedido pago + ingresso ainda não usado, com UPDATE condicional).

Como testar a compra em dev: cadastre um congressista, vá em `/ingressos`,
clique em "Comprar ingresso" e aprove na tela de pagamento simulado. O QR
aparece na Minha área; valide em `/administradores/checkin` com um usuário
de portaria.

## Estrutura

- `src/app/` — rotas (App Router: páginas e API)
- `src/modules/` — regras de negócio por domínio (`pagamentos`, `midia`,
  e futuramente `eventos`, `pedidos`, `ingressos`, `admin`), cada um com
  interfaces (porta) e implementações (adapter) quando aplicável
- `src/db/` — schema Drizzle, migrations e seed
- `docs/` — documentação, incluindo ADRs de decisões arquiteturais
- `tests/` — testes automatizados
- `scripts/` — scripts utilitários e de automação

## Notas

- `npm audit` reporta uma vulnerabilidade moderada em uma dependência
  transitiva do `drizzle-kit` (esbuild da ferramenta de dev). Afeta apenas o
  servidor de desenvolvimento local dessa CLI, não o código que roda em
  produção — corrigir exigiria downgrade do `drizzle-kit`, o que não vale a
  pena no momento.
