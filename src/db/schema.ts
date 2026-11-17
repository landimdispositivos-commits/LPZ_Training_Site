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
]);

export const usuarios = pgTable("usuarios", {
  id: text("id").primaryKey(),
  name: text("nome").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verificado").notNull().default(false),
  image: text("imagem"),
  papel: papelUsuarioEnum("papel").notNull().default("congressista"),
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
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

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
export const tipoProdutoEnum = pgEnum("tipo_produto", [
  "full_pass",
  "pacote_baile",
  "baile_avulso",
  "jack_and_jill",
  "paparazzi_video",
  "paparazzi_foto",
]);

export const lotes = pgTable("lotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipo: tipoProdutoEnum("tipo").notNull().default("full_pass"),
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
  // Idioma em que o comprador estava no site ("pt"/"en"): usado nos e-mails
  // de confirmação e do ingresso, que podem sair depois (webhook do Pix).
  idioma: text("idioma").notNull().default("pt"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

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
