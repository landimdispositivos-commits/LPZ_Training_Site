import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Login (Better Auth) — congressistas, profissionais e administradores
//
// As chaves JS seguem os nomes de campo que o Better Auth espera (ex:
// `emailVerified`); só os nomes de tabela/coluna no banco são em português.
// O mapeamento modelo → tabela fica em src/modules/auth/auth.ts.
// ---------------------------------------------------------------------------

// Cadastro público sempre cria "congressista". Os demais papéis só nascem por
// convite (src/modules/auth/convite.ts):
// - profissional: professor/DJ
// - organizador: administrador com acesso total (duas etapas obrigatória)
// - portaria: administrador restrito ao check-in (duas etapas obrigatória)
// - acesso_total: tudo o que o organizador faz, em qualquer área nova
//   (duas etapas obrigatória)
export const papelUsuarioEnum = pgEnum("papel_usuario", [
  "congressista",
  "profissional",
  "organizador",
  "portaria",
  "acesso_total",
  "midias",
]);

export const usuarios = pgTable("usuarios", {
  id: text("id").primaryKey(),
  name: text("nome").notNull(),
  // Como a pessoa prefere ser chamada no site (opcional; ex: "Landim").
  apelido: text("apelido"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verificado").notNull().default(false),
  image: text("imagem"),
  papel: papelUsuarioEnum("papel").notNull().default("congressista"),
  // Perfis adicionais (além do principal): uma pessoa pode ter vários
  // (ex: Portaria + Mídias). O acesso vale se QUALQUER perfil permitir.
  perfisExtras: text("perfis_extras").array().notNull().default(sql`'{}'::text[]`),
  // Perfil público do profissional (foto, bio, aulas no cronograma).
  professorId: uuid("professor_id").unique().references(() => professores.id, { onDelete: "set null" }),
  // Dados do cadastro de congressista — obrigatórios para congressistas
  // (validados na ação de completar cadastro), vazios para profissionais.
  // CPF é exigido pelo Mercado Pago no pagamento de brasileiros; guardado só
  // com dígitos. O unique permite vários NULL.
  celular: text("celular"),
  cpf: text("cpf").unique(),
  pais: text("pais"),
  uf: text("uf"),
  // Ficha completada em /congressistas/completar-cadastro (obrigatória para
  // congressistas antes da área logada — inclusive quem entra pelo Google).
  cidade: text("cidade"),
  dataNascimento: date("data_nascimento", { mode: "string" }), // "AAAA-MM-DD"
  // Opcionais (LGPD: o titular escolhe informar).
  cep: text("cep"),
  logradouro: text("logradouro"),
  numero: text("numero"),
  complemento: text("complemento"),
  bairro: text("bairro"),
  naturalidadeCidade: text("naturalidade_cidade"),
  naturalidadeEstado: text("naturalidade_estado"), // UF ou país
  comoConheceu: text("como_conheceu"),
  cadastroCompletoEm: timestamp("cadastro_completo_em", { withTimezone: true }),
  // Momento em que o titular aceitou a Política de Privacidade (LGPD).
  privacidadeAceitaEm: timestamp("privacidade_aceita_em", { withTimezone: true }),
  // Verificação em duas etapas (app autenticador) — obrigatória para
  // organizador e portaria; gerida pelo plugin twoFactor do Better Auth.
  twoFactorEnabled: boolean("duas_etapas_ativa").notNull().default(false),
  createdAt: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const sessoes = pgTable("sessoes", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expira_em", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip"),
  userAgent: text("user_agent"),
  userId: text("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
});

export const contas = pgTable("contas", {
  id: text("id").primaryKey(),
  accountId: text("conta_id").notNull(),
  providerId: text("provedor_id").notNull(),
  userId: text("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expira_em", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expira_em", { withTimezone: true }),
  scope: text("scope"),
  // Hash da senha (scrypt, gerado pelo Better Auth) — nunca a senha em si.
  password: text("senha_hash"),
  createdAt: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

// Segredo TOTP e códigos de recuperação — ambos criptografados pelo Better
// Auth com o BETTER_AUTH_SECRET antes de chegar aqui.
export const duasEtapas = pgTable("duas_etapas", {
  id: text("id").primaryKey(),
  secret: text("segredo").notNull(),
  backupCodes: text("codigos_recuperacao").notNull(),
  userId: text("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  verified: boolean("verificado").notNull().default(true),
  failedVerificationCount: integer("tentativas_falhas").notNull().default(0),
  lockedUntil: timestamp("bloqueado_ate", { withTimezone: true }),
}, (t) => ({
  usuarioIdx: uniqueIndex("duas_etapas_usuario_unico").on(t.userId),
}));

export const verificacoes = pgTable("verificacoes", {
  id: text("id").primaryKey(),
  identifier: text("identificador").notNull(),
  value: text("valor").notNull(),
  expiresAt: timestamp("expira_em", { withTimezone: true }).notNull(),
  createdAt: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Conteúdo público: professores e cronograma
// ---------------------------------------------------------------------------

export const professores = pgTable("professores", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  bio: text("bio"),
  // Bio em inglês (opcional): sem ela, a versão em inglês mostra a bio em português.
  bioEn: text("bio_en"),
  fotoUrl: text("foto_url"),
  instagram: text("instagram"),
  // "professor" (casal de professores) ou "dj": cada um tem sua página no site.
  categoria: text("categoria").notNull().default("professor"),
  ordem: integer("ordem").notNull().default(0),
  // Uso interno da organização (não aparece no site). Opcional.
  dataNascimento: date("data_nascimento", { mode: "string" }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// Caixas de texto editáveis na própria página pela organização (título e
// texto em pt/en/es + ordem). `pagina`: "servicos" ou "quem_somos".
export const caixasTexto = pgTable(
  "caixas_texto",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pagina: text("pagina").notNull(),
    titulo: text("titulo").notNull(),
    tituloEn: text("titulo_en"),
    tituloEs: text("titulo_es"),
    texto: text("texto").notNull().default(""),
    textoEn: text("texto_en"),
    textoEs: text("texto_es"),
    ordem: integer("ordem").notNull().default(0),
    // Oculta: caixa (e a página dela) só aparece para a organização.
    oculta: boolean("oculta").notNull().default(false),
    // Página própria (Serviços): a caixa vira link para /servicos/<id>.
    temPagina: boolean("tem_pagina").notNull().default(false),
    detalhe: text("detalhe"),
    detalheEn: text("detalhe_en"),
    detalheEs: text("detalhe_es"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ paginaIdx: index("caixas_texto_pagina_idx").on(t.pagina, t.ordem) }),
);

export const cronogramaItens = pgTable("cronograma_itens", {
  id: uuid("id").primaryKey().defaultRandom(),
  dia: text("dia").notNull(), // ex: "2026-11-06"
  horarioInicio: text("horario_inicio").notNull(), // ex: "19:00"
  horarioFim: text("horario_fim"),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  local: text("local"),
  professorId: uuid("professor_id").references(() => professores.id, {
    onDelete: "set null",
  }),
  ordem: integer("ordem").notNull().default(0),
});

// ---------------------------------------------------------------------------
// Ingressos: lotes, pedidos, ingressos emitidos, eventos de pagamento
// ---------------------------------------------------------------------------

// Tipo de produto vendido em cada lote. Os de entrada (full pass e bailes)
// geram ingresso com QR; Jack and Jill (inscrição na competição) e paparazzi
// (serviços de foto/vídeo) não geram QR.
// Tipo de produto vendido em cada lote: um dos fixos (src/modules/ingressos/produtos.ts)
// ou a chave de um pacote criado pela organização (produtos_personalizados).
// Era um enum do Postgres até a migração 0023; virou texto para aceitar pacotes novos.
export const produtosPersonalizados = pgTable("produtos_personalizados", {
  chave: text("chave").primaryKey(), // ex: "extra_workshop_de_giro"
  nome: text("nome").notNull(),
  nomeEn: text("nome_en"),
  nomeEs: text("nome_es"),
  // "entrada" (gera QR para a portaria) ou "servico" (marcado como utilizado).
  presenca: text("presenca").notNull().default("servico"),
  // Cliente escolhe entre os lotes ativos (ex.: durações), como nas massagens.
  opcoes: boolean("opcoes").notNull().default(false),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const lotes = pgTable("lotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipo: text("tipo").notNull().default("full_pass"),
  nome: text("nome").notNull(), // ex: "1º lote"
  precoCentavos: integer("preco_centavos").notNull(),
  quantidadeTotal: integer("quantidade_total").notNull(),
  quantidadeVendida: integer("quantidade_vendida").notNull().default(0),
  ativo: boolean("ativo").notNull().default(true),
  dataInicio: timestamp("data_inicio", { withTimezone: true }),
  dataFim: timestamp("data_fim", { withTimezone: true }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const statusPedidoEnum = pgEnum("status_pedido", [
  "pendente",
  "pago",
  "cancelado",
  "reembolsado",
]);

export const pedidos = pgTable("pedidos", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  telefone: text("telefone"),
  cpf: text("cpf"),
  loteId: uuid("lote_id").notNull().references(() => lotes.id, { onDelete: "restrict" }),
  valorCentavos: integer("valor_centavos").notNull(),
  status: statusPedidoEnum("status").notNull().default("pendente"),
  gatewayPreferenceId: text("gateway_preference_id"),
  // Sacola: pedidos pagos juntos compartilham o mesmo compra_id (enviado ao
  // gateway como referência externa). Nulo = compra de um item só (a
  // referência é o próprio id do pedido).
  compraId: uuid("compra_id"),
  // Quando o pagamento foi aprovado e o id do pagamento no gateway (estorno).
  pagoEm: timestamp("pago_em", { withTimezone: true }),
  gatewayPagamentoId: text("gateway_pagamento_id"),
  // Cancelamento pelo próprio cliente (direito de arrependimento, 7 dias).
  // Cancelado e sem estornadoEm = estorno aguardando aprovação da organização.
  canceladoPeloClienteEm: timestamp("cancelado_pelo_cliente_em", { withTimezone: true }),
  estornadoEm: timestamp("estornado_em", { withTimezone: true }),
  estornadoPor: text("estornado_por").references(() => usuarios.id, { onDelete: "set null" }),
  // Idioma em que o comprador estava no site ("pt"/"en"): usado nos e-mails
  // de confirmação e do ingresso, que podem sair depois (webhook do Pix).
  idioma: text("idioma").notNull().default("pt"),
  // Forma de pagamento informada pelo gateway na aprovação (pix, credito,
  // debito, saldo, boleto) e nº de parcelas no crédito.
  formaPagamento: text("forma_pagamento"),
  parcelas: integer("parcelas"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  compraIdx: index("pedidos_compra_id_idx").on(t.compraId),
}));

export const statusIngressoEnum = pgEnum("status_ingresso", [
  "valido",
  "usado",
  "cancelado",
]);

export const ingressos = pgTable("ingressos", {
  id: uuid("id").primaryKey().defaultRandom(),
  pedidoId: uuid("pedido_id").notNull().references(() => pedidos.id, { onDelete: "restrict" }),
  status: statusIngressoEnum("status").notNull().default("valido"),
  checkinEm: timestamp("checkin_em", { withTimezone: true }),
  checkinPor: text("checkin_por").references(() => usuarios.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// Registro de presença (check-in). Uma linha por uso: entrada num dia do
// evento ou serviço realizado (paparazzi, Jack and Jill). A unicidade por
// pedido+dia impede registrar duas vezes o mesmo dia (dois porteiros lendo o
// mesmo QR). dia: "sexta" | "sabado" | "domingo" | "unico".
export const presencas = pgTable("presencas", {
  id: uuid("id").primaryKey().defaultRandom(),
  pedidoId: uuid("pedido_id").notNull().references(() => pedidos.id, { onDelete: "restrict" }),
  tipo: text("tipo").notNull(), // "entrada" | "servico"
  dia: text("dia").notNull(),
  registradoEm: timestamp("registrado_em", { withTimezone: true }).notNull().defaultNow(),
  registradoPor: text("registrado_por").references(() => usuarios.id, { onDelete: "set null" }),
  registradoPorNome: text("registrado_por_nome"),
}, (t) => ({
  pedidoDiaUnico: uniqueIndex("presencas_pedido_dia_unico").on(t.pedidoId, t.dia),
}));

// Log de eventos recebidos do gateway de pagamento — fonte de idempotência.
// O webhook nunca é tratado como verdade absoluta: o adapter sempre confirma
// o status consultando a API do gateway antes de atualizar um pedido.
export const eventosPagamento = pgTable("eventos_pagamento", {
  id: uuid("id").primaryKey().defaultRandom(),
  pedidoId: uuid("pedido_id").notNull().references(() => pedidos.id, { onDelete: "restrict" }),
  provedorEventoId: text("provedor_evento_id").notNull(),
  tipo: text("tipo").notNull(),
  statusRecebido: text("status_recebido"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  eventoUnico: uniqueIndex("eventos_pagamento_provedor_evento_id_unico").on(t.provedorEventoId),
}));

// ---------------------------------------------------------------------------
// Mídia: fotos (armazenamento próprio) e vídeos (embed externo)
// ---------------------------------------------------------------------------

export const tipoMidiaEnum = pgEnum("tipo_midia", ["foto", "video", "audio"]);

export const midia = pgTable("midia", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipo: tipoMidiaEnum("tipo").notNull(),
  // foto: caminho relativo no StorageAdapter. video: ID do vídeo no YouTube.
  // audio: URL de incorporação (Spotify ou SoundCloud), já validada.
  referencia: text("referencia").notNull(),
  titulo: text("titulo"),
  ordem: integer("ordem").notNull().default(0),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Fornecedores do evento (som, luz, local, buffet...). Uso interno da
// organização — dados de empresas/contatos comerciais, não de participantes.
// ---------------------------------------------------------------------------

export const fornecedores = pgTable("fornecedores", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  categoria: text("categoria").notNull(), // lista fixa em src/modules/fornecedores
  status: text("status").notNull().default("cotacao"), // cotacao | contratado | pago | descartado
  contato: text("contato"),
  telefone: text("telefone"),
  email: text("email"),
  site: text("site"),
  valorCentavos: integer("valor_centavos"),
  observacoes: text("observacoes"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Trilha de auditoria (usuários e permissões). Só recebe INSERT — o código
// não tem função de editar nem apagar registro. Guarda quem fez (autor), em
// quem (alvo), o quê (ação) e os detalhes (antes/depois), com IP e navegador.
// Nomes e e-mails ficam copiados aqui para o histórico não se perder se a
// conta for excluída depois.
// ---------------------------------------------------------------------------

export const auditoria = pgTable("auditoria", {
  id: uuid("id").primaryKey().defaultRandom(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  acao: text("acao").notNull(), // ver src/modules/auditoria
  autorId: text("autor_id"), // null = sistema / linha de comando
  autorNome: text("autor_nome"),
  autorEmail: text("autor_email"),
  alvoId: text("alvo_id"),
  alvoNome: text("alvo_nome"),
  alvoEmail: text("alvo_email"),
  detalhes: jsonb("detalhes").$type<Record<string, unknown>>(),
  ip: text("ip"),
  navegador: text("navegador"),
}, (t) => ({
  alvoIdx: index("auditoria_alvo_idx").on(t.alvoId, t.criadoEm),
  criadoIdx: index("auditoria_criado_idx").on(t.criadoEm),
}));

// Configurações simples do site editadas pela organização no próprio site
// (ex.: contatos do Fale conosco). Chave → valor em texto.
export const configuracoes = pgTable("configuracoes", {
  chave: text("chave").primaryKey(),
  valor: text("valor").notNull(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Bar do evento (vendas, estoque e financeiro). Módulo isolado (prefixo bar_)
// para poder ser reaproveitado no site LPZ Baile. Tudo é separado por evento.
// Valores em centavos. Nada é apagado de verdade: o estoque é um livro-razão
// (bar_estoque_movimentos) e o saldo é a soma dele.
// ---------------------------------------------------------------------------

export const barEventos = pgTable(
  "bar_eventos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: text("nome").notNull(),
    inicio: date("inicio", { mode: "string" }),
    fim: date("fim", { mode: "string" }),
    // Só um evento fica "em andamento" por vez: é o que o cardápio e o caixa usam.
    emAndamento: boolean("em_andamento").notNull().default(false),
    // Formas de venda ligadas neste evento (a gestão escolhe).
    usaCaixa: boolean("usa_caixa").notNull().default(true),
    usaComanda: boolean("usa_comanda").notNull().default(true),
    // Pedido online pelo site (Pix/cartão). Desligado por padrão: depende do gateway.
    usaOnline: boolean("usa_online").notNull().default(false),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    umEmAndamento: uniqueIndex("bar_eventos_um_em_andamento").on(t.emAndamento).where(sql`${t.emAndamento}`),
  }),
);

export const barCategorias = pgTable("bar_categorias", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull().unique(),
  ordem: integer("ordem").notNull().default(0),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const barProdutos = pgTable(
  "bar_produtos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventoId: uuid("evento_id").notNull().references(() => barEventos.id),
    categoriaId: uuid("categoria_id").references(() => barCategorias.id, { onDelete: "set null" }),
    nome: text("nome").notNull(),
    unidade: text("unidade").notNull().default("un"),
    // Preço de custo (o que a organização paga) e preço de venda (o que cobra).
    custoCentavos: integer("custo_centavos").notNull().default(0),
    precoCentavos: integer("preco_centavos").notNull(),
    estoqueMinimo: integer("estoque_minimo").notNull().default(0),
    fotoUrl: text("foto_url"),
    visivelCardapio: boolean("visivel_cardapio").notNull().default(true),
    // Vendido no caixa? (insumos como garrafa de vodka ou limão não são.)
    aVenda: boolean("a_venda").notNull().default(true),
    // Ficha técnica: ao vender, baixa os insumos da receita (bar_receitas_itens)
    // em vez do estoque do próprio produto; o custo vem da soma dos insumos.
    usaFicha: boolean("usa_ficha").notNull().default(false),
    ativo: boolean("ativo").notNull().default(true),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    eventoIdx: index("bar_produtos_evento_idx").on(t.eventoId),
  }),
);

export const barCompras = pgTable(
  "bar_compras",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventoId: uuid("evento_id").notNull().references(() => barEventos.id),
    fornecedor: text("fornecedor"),
    observacao: text("observacao"),
    dataCompra: date("data_compra", { mode: "string" }).notNull(),
    totalCentavos: integer("total_centavos").notNull(),
    autorId: text("autor_id"),
    autorNome: text("autor_nome"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ eventoIdx: index("bar_compras_evento_idx").on(t.eventoId, t.dataCompra) }),
);

export const barComprasItens = pgTable("bar_compras_itens", {
  id: uuid("id").primaryKey().defaultRandom(),
  compraId: uuid("compra_id").notNull().references(() => barCompras.id, { onDelete: "cascade" }),
  produtoId: uuid("produto_id").notNull().references(() => barProdutos.id),
  quantidade: integer("quantidade").notNull(),
  custoUnitCentavos: integer("custo_unit_centavos").notNull(),
});

// Livro-razão do estoque. quantidade > 0 entra, < 0 sai.
// tipo: entrada | perda | quebra | cortesia | consumo_equipe | ajuste | venda | estorno
export const barEstoqueMovimentos = pgTable(
  "bar_estoque_movimentos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventoId: uuid("evento_id").notNull().references(() => barEventos.id),
    produtoId: uuid("produto_id").notNull().references(() => barProdutos.id),
    tipo: text("tipo").notNull(),
    quantidade: integer("quantidade").notNull(),
    // Custo unitário no momento (para valorar perdas e cortesias).
    custoUnitCentavos: integer("custo_unit_centavos"),
    motivo: text("motivo"),
    compraId: uuid("compra_id").references(() => barCompras.id),
    // Preenchido pelo caixa (fase 2); sem chave estrangeira até a tabela existir.
    vendaId: uuid("venda_id"),
    // Lançamento de comanda que gerou este movimento (para devolver exatamente ao cancelar).
    comandaItemId: uuid("comanda_item_id"),
    // Pedido online que reservou (ou liberou) este estoque.
    pedidoOnlineId: uuid("pedido_online_id"),
    autorId: text("autor_id"),
    autorNome: text("autor_nome"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    produtoIdx: index("bar_mov_produto_idx").on(t.produtoId, t.criadoEm),
    eventoIdx: index("bar_mov_evento_idx").on(t.eventoId, t.criadoEm),
  }),
);

// Caixa do Bar: cada operador abre o seu caixa (com o troco inicial) e fecha no
// fim do turno conferindo o dinheiro contado com o esperado.
export const barCaixas = pgTable(
  "bar_caixas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventoId: uuid("evento_id").notNull().references(() => barEventos.id),
    operadorId: text("operador_id").notNull(),
    operadorNome: text("operador_nome").notNull(),
    valorInicialCentavos: integer("valor_inicial_centavos").notNull().default(0),
    abertoEm: timestamp("aberto_em", { withTimezone: true }).notNull().defaultNow(),
    fechadoEm: timestamp("fechado_em", { withTimezone: true }),
    dinheiroEsperadoCentavos: integer("dinheiro_esperado_centavos"),
    dinheiroContadoCentavos: integer("dinheiro_contado_centavos"),
  },
  (t) => ({
    umAbertoPorOperador: uniqueIndex("bar_caixas_um_aberto").on(t.eventoId, t.operadorId).where(sql`${t.fechadoEm} is null`),
  }),
);

// Venda lançada no caixa. forma_pagamento: dinheiro | pix | debito | credito.
// status: paga | estornada. O custo do momento fica guardado para o lucro
// histórico não mudar se o custo do produto mudar depois.
export const barVendas = pgTable(
  "bar_vendas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventoId: uuid("evento_id").notNull().references(() => barEventos.id),
    // Vazio nas vendas online (não passam por caixa).
    caixaId: uuid("caixa_id").references(() => barCaixas.id),
    numero: integer("numero").notNull(),
    formaPagamento: text("forma_pagamento").notNull(),
    // De onde veio a venda: caixa | comanda | online.
    origem: text("origem").notNull().default("caixa"),
    comandaId: uuid("comanda_id"),
    totalCentavos: integer("total_centavos").notNull(),
    custoTotalCentavos: integer("custo_total_centavos").notNull(),
    recebidoCentavos: integer("recebido_centavos"),
    status: text("status").notNull().default("paga"),
    operadorId: text("operador_id").notNull(),
    operadorNome: text("operador_nome").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    estornadaEm: timestamp("estornada_em", { withTimezone: true }),
    estornadaPorNome: text("estornada_por_nome"),
    motivoEstorno: text("motivo_estorno"),
  },
  (t) => ({
    numeroUnico: uniqueIndex("bar_vendas_numero_unico").on(t.eventoId, t.numero),
    caixaIdx: index("bar_vendas_caixa_idx").on(t.caixaId),
  }),
);

export const barVendasItens = pgTable("bar_vendas_itens", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendaId: uuid("venda_id").notNull().references(() => barVendas.id, { onDelete: "cascade" }),
  produtoId: uuid("produto_id").notNull().references(() => barProdutos.id),
  nome: text("nome").notNull(),
  quantidade: integer("quantidade").notNull(),
  precoUnitCentavos: integer("preco_unit_centavos").notNull(),
  custoUnitCentavos: integer("custo_unit_centavos").notNull(),
});

// Ticket de retirada (QR). status: pendente | entregue | cancelado.
export const barTickets = pgTable("bar_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendaId: uuid("venda_id").notNull().unique().references(() => barVendas.id),
  codigo: text("codigo").notNull().unique(),
  status: text("status").notNull().default("pendente"),
  entregueEm: timestamp("entregue_em", { withTimezone: true }),
  entreguePorNome: text("entregue_por_nome"),
});

// Ficha técnica: quantos de cada insumo (na unidade do insumo) uma unidade do produto consome.
export const barReceitasItens = pgTable(
  "bar_receitas_itens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    produtoId: uuid("produto_id").notNull().references(() => barProdutos.id, { onDelete: "cascade" }),
    insumoId: uuid("insumo_id").notNull().references(() => barProdutos.id),
    quantidade: integer("quantidade").notNull(),
  },
  (t) => ({
    unico: uniqueIndex("bar_receitas_unico").on(t.produtoId, t.insumoId),
  }),
);

// Comanda (pulseira ou cartão com número): o cliente consome no bar e paga no
// caixa no final. O estoque baixa no lançamento. status: aberta | paga | cancelada.
export const barComandas = pgTable(
  "bar_comandas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventoId: uuid("evento_id").notNull().references(() => barEventos.id),
    numero: text("numero").notNull(),
    status: text("status").notNull().default("aberta"),
    abertaEm: timestamp("aberta_em", { withTimezone: true }).notNull().defaultNow(),
    abertaPorNome: text("aberta_por_nome"),
    pagaEm: timestamp("paga_em", { withTimezone: true }),
    vendaId: uuid("venda_id"),
  },
  (t) => ({
    umaAbertaPorNumero: uniqueIndex("bar_comandas_uma_aberta").on(t.eventoId, t.numero).where(sql`${t.status} = 'aberta'`),
    eventoIdx: index("bar_comandas_evento_idx").on(t.eventoId, t.status),
  }),
);

// Itens lançados na comanda (preço e custo do momento). status: ativo | cancelado.
export const barComandaItens = pgTable(
  "bar_comanda_itens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comandaId: uuid("comanda_id").notNull().references(() => barComandas.id, { onDelete: "cascade" }),
    produtoId: uuid("produto_id").notNull().references(() => barProdutos.id),
    nome: text("nome").notNull(),
    quantidade: integer("quantidade").notNull(),
    precoUnitCentavos: integer("preco_unit_centavos").notNull(),
    custoUnitCentavos: integer("custo_unit_centavos").notNull(),
    status: text("status").notNull().default("ativo"),
    lancadoPorNome: text("lancado_por_nome"),
    lancadoEm: timestamp("lancado_em", { withTimezone: true }).notNull().defaultNow(),
    canceladoPorNome: text("cancelado_por_nome"),
    canceladoEm: timestamp("cancelado_em", { withTimezone: true }),
    motivoCancelamento: text("motivo_cancelamento"),
  },
  (t) => ({ comandaIdx: index("bar_comanda_itens_idx").on(t.comandaId) }),
);

// Pedido online do cliente (pago por Pix ou cartão pelo site). O estoque fica
// reservado até expira_em (15 min). status: pendente | pago | expirado |
// cancelado | estornado | precisa_estorno (pagou depois de a reserva vencer e
// o estoque acabou: a gestão devolve o dinheiro).
export const barPedidosOnline = pgTable(
  "bar_pedidos_online",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventoId: uuid("evento_id").notNull().references(() => barEventos.id),
    usuarioId: text("usuario_id").notNull(),
    nome: text("nome").notNull(),
    email: text("email").notNull(),
    totalCentavos: integer("total_centavos").notNull(),
    status: text("status").notNull().default("pendente"),
    preferenceId: text("preference_id"),
    checkoutUrl: text("checkout_url"),
    gatewayPagamentoId: text("gateway_pagamento_id"),
    formaPagamento: text("forma_pagamento"),
    parcelas: integer("parcelas"),
    vendaId: uuid("venda_id"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    pagoEm: timestamp("pago_em", { withTimezone: true }),
    encerradoEm: timestamp("encerrado_em", { withTimezone: true }),
  },
  (t) => ({
    usuarioIdx: index("bar_pedidos_online_usuario_idx").on(t.usuarioId, t.criadoEm),
    statusIdx: index("bar_pedidos_online_status_idx").on(t.eventoId, t.status),
  }),
);

export const barPedidosOnlineItens = pgTable("bar_pedidos_online_itens", {
  id: uuid("id").primaryKey().defaultRandom(),
  pedidoId: uuid("pedido_id").notNull().references(() => barPedidosOnline.id, { onDelete: "cascade" }),
  produtoId: uuid("produto_id").notNull().references(() => barProdutos.id),
  nome: text("nome").notNull(),
  quantidade: integer("quantidade").notNull(),
  precoUnitCentavos: integer("preco_unit_centavos").notNull(),
  custoUnitCentavos: integer("custo_unit_centavos").notNull(),
});

// Cartão guardado no gateway de pagamento (Mercado Pago) para compras do Bar.
// NUNCA guardamos número, validade completa nem código de segurança: só o
// identificador devolvido pelo gateway e dados de exibição (bandeira e final).
// A validade (MM/AA) é só para avisar o cliente de cartão vencido.
export const barCartoesSalvos = pgTable(
  "bar_cartoes_salvos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: text("usuario_id").notNull(),
    gatewayClienteId: text("gateway_cliente_id").notNull(),
    gatewayCartaoId: text("gateway_cartao_id").notNull(),
    bandeira: text("bandeira").notNull(),
    ultimos4: text("ultimos4").notNull(),
    validade: text("validade").notNull(),
    padrao: boolean("padrao").notNull().default(false),
    // Momento em que o cliente autorizou guardar o cartão (LGPD/consentimento).
    consentimentoEm: timestamp("consentimento_em", { withTimezone: true }).notNull().defaultNow(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    usuarioIdx: index("bar_cartoes_usuario_idx").on(t.usuarioId),
    umPadrao: uniqueIndex("bar_cartoes_um_padrao").on(t.usuarioId).where(sql`${t.padrao}`),
    cartaoUnico: uniqueIndex("bar_cartoes_cartao_unico").on(t.usuarioId, t.gatewayCartaoId),
  }),
);

// Retiradas de um ticket (QR inteligente): cada vez que o balcão entrega itens,
// uma linha é gravada aqui e nunca é alterada nem apagada. É a prova de quantos
// itens foram entregues, quando e por quem. Saldo do item = quantidade vendida
// menos a soma das retiradas.
export const barRetiradas = pgTable(
  "bar_retiradas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id").notNull().references(() => barTickets.id),
    vendaItemId: uuid("venda_item_id").notNull().references(() => barVendasItens.id),
    quantidade: integer("quantidade").notNull(),
    entreguePorId: text("entregue_por_id"),
    entreguePorNome: text("entregue_por_nome"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ ticketIdx: index("bar_retiradas_ticket_idx").on(t.ticketId, t.criadoEm) }),
);
