import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contas, duasEtapas, sessoes, usuarios, verificacoes } from "@/db/schema";
import { emailComLink, enviarEmailEmSegundoPlano } from "@/modules/email";
import { SENHA_MAX, SENHA_MIN } from "./cadastro";
import { ehAdmin } from "./papeis";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET não definida — veja .env.example.");
}

// Login com Google só fica ativo com as duas credenciais no .env.
export const GOOGLE_ATIVO = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Rota de retorno do Google (Better Auth) — usada para reconhecer, nos hooks,
// que a operação veio do login social.
const ROTA_CALLBACK_OAUTH = "/callback/:id";

const MSG_ADMIN_SEM_GOOGLE =
  "Contas de administrador entram só por e-mail, senha e verificação em duas etapas.";

// Código próprio: o formulário mostra a mensagem (já em português) ao usuário.
export const CODIGO_VALIDACAO = "LPZ_VALIDACAO";

function erroValidacao({ message }: { message: string }) {
  return new APIError("BAD_REQUEST", { message, code: CODIGO_VALIDACAO });
}

async function ehContaAdmin(usuarioId: string) {
  const [u] = await db
    .select({ papel: usuarios.papel })
    .from(usuarios)
    .where(eq(usuarios.id, usuarioId))
    .limit(1);
  return ehAdmin(u?.papel);
}

export const auth = betterAuth({
  baseURL: process.env.APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: "pg",
    // Modelos do Better Auth → tabelas em português.
    schema: {
      user: usuarios,
      session: sessoes,
      account: contas,
      verification: verificacoes,
      twoFactor: duasEtapas,
    },
  }),

  user: {
    // Todos com input: false — só o servidor grava (a ficha é salva pela ação
    // de /congressistas/completar-cadastro, que valida tudo antes).
    additionalFields: {
      apelido: { type: "string", required: false, input: false },
      celular: { type: "string", required: false, input: false },
      cpf: { type: "string", required: false, input: false },
      pais: { type: "string", required: false, input: false },
      uf: { type: "string", required: false, input: false },
      cidade: { type: "string", required: false, input: false },
      dataNascimento: { type: "string", required: false, input: false },
      cep: { type: "string", required: false, input: false },
      logradouro: { type: "string", required: false, input: false },
      numero: { type: "string", required: false, input: false },
      complemento: { type: "string", required: false, input: false },
      bairro: { type: "string", required: false, input: false },
      naturalidadeCidade: { type: "string", required: false, input: false },
      naturalidadeEstado: { type: "string", required: false, input: false },
      comoConheceu: { type: "string", required: false, input: false },
      cadastroCompletoEm: { type: "date", required: false, input: false },
      privacidadeAceitaEm: { type: "date", required: false, input: false },
      papel: { type: "string", required: false, input: false, defaultValue: "congressista" },
      professorId: { type: "string", required: false, input: false },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: SENHA_MIN,
    maxPasswordLength: SENHA_MAX,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hora
    sendResetPassword: async ({ user, url }) => {
      const { texto, html } = emailComLink({
        nome: user.name,
        intro: "Recebemos um pedido para redefinir a senha da sua conta no LPZ Training. O link vale por 1 hora.",
        textoBotao: "Redefinir senha",
        url,
      });
      enviarEmailEmSegundoPlano({ para: user.email, assunto: "Redefinir senha — LPZ Training", texto, html });
    },
    // Cadastro com e-mail já existente responde "sucesso" (não revela quem
    // tem conta); o dono do e-mail é avisado por aqui.
    onExistingUserSignUp: async ({ user }) => {
      const { texto, html } = emailComLink({
        nome: user.name,
        intro: "Alguém tentou criar uma conta no LPZ Training com este e-mail, mas você já tem cadastro. Se esqueceu a senha, recupere pelo link abaixo.",
        textoBotao: "Entrar ou recuperar senha",
        url: `${process.env.APP_URL}/congressistas`,
      });
      enviarEmailEmSegundoPlano({ para: user.email, assunto: "Você já tem conta — LPZ Training", texto, html });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true, // login sem e-mail confirmado reenvia o link
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // 24 horas
    sendVerificationEmail: async ({ user, url }) => {
      const { texto, html } = emailComLink({
        nome: user.name,
        intro: "Confirme seu e-mail para ativar sua conta de congressista no LPZ Training. O link vale por 24 horas.",
        textoBotao: "Confirmar e-mail",
        url,
      });
      enviarEmailEmSegundoPlano({ para: user.email, assunto: "Confirme seu e-mail — LPZ Training", texto, html });
    },
  },

  // Login com Google — só liga se as credenciais estiverem no .env.
  // disableImplicitSignUp: só cria conta nova quando o botão pede
  // (requestSignUp — área de Congressistas). Na área de Profissionais o
  // Google só entra em conta que já existe (convite).
  socialProviders: GOOGLE_ATIVO
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          prompt: "select_account",
          disableImplicitSignUp: true,
        },
      }
    : {},

  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          // Sem contexto de requisição = código do próprio servidor (ex: script
          // de convite de profissional), que já monta os dados certos.
          if (!ctx) return { data: user };

          const nome = String(user.name ?? "").trim().slice(0, 100);

          // Cadastro pelo Google: nasce congressista, com ficha e aceite da
          // Política pendentes (pedidos em /congressistas/completar-cadastro).
          if (ctx.path === ROTA_CALLBACK_OAUTH) {
            return {
              data: {
                ...user,
                name: nome.length >= 2 ? nome : "Congressista",
                papel: "congressista",
                professorId: null,
                privacidadeAceitaEm: null,
                cadastroCompletoEm: null,
              },
            };
          }

          // Por HTTP, fora o Google, só o cadastro público por e-mail/senha.
          if (ctx.path !== "/sign-up/email") {
            throw erroValidacao({ message: "Operação não permitida." });
          }

          const body = (ctx.body ?? {}) as Record<string, unknown>;
          if (body.aceitePrivacidade !== true) {
            throw erroValidacao({
              message: "É preciso aceitar a Política de Privacidade para criar a conta.",
            });
          }
          if (nome.length < 2) {
            throw erroValidacao({ message: "Informe seu nome completo." });
          }

          return {
            data: {
              ...user,
              name: nome,
              privacidadeAceitaEm: new Date(),
              papel: "congressista",
              professorId: null,
              cadastroCompletoEm: null,
            },
          };
        },
      },
    },

    // Administradores entram só por e-mail + senha + duas etapas. O plugin de
    // duas etapas não cobre o login social, então o Google é barrado aqui
    // (vincular a conta e abrir sessão).
    account: {
      create: {
        before: async (account) => {
          if (account.providerId !== "credential" && (await ehContaAdmin(account.userId))) {
            throw erroValidacao({ message: MSG_ADMIN_SEM_GOOGLE });
          }
        },
      },
    },
    session: {
      create: {
        before: async (session, ctx) => {
          if (ctx?.path === ROTA_CALLBACK_OAUTH && (await ehContaAdmin(session.userId))) {
            throw erroValidacao({ message: MSG_ADMIN_SEM_GOOGLE });
          }
        },
      },
    },
  },

  advanced: {
    // Atrás de Cloudflare + Nginx: o Nginx grava o IP real em X-Real-IP
    // (real_ip com CF-Connecting-IP). Usado no limite de tentativas.
    ipAddress: { ipAddressHeaders: ["x-real-ip"] },
  },

  rateLimit: {
    enabled: true,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/sign-in/social": { window: 60, max: 10 },
      "/request-password-reset": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
      "/two-factor/verify-totp": { window: 60, max: 5 },
      "/two-factor/verify-backup-code": { window: 60, max: 5 },
      "/two-factor/enable": { window: 60, max: 5 },
    },
  },

  plugins: [
    // Duas etapas por app autenticador (TOTP). Obrigatória para administradores
    // — a exigência é aplicada nas páginas/ações de /administradores.
    twoFactor({
      issuer: "LPZ Training",
      accountLockout: { enabled: true, maxFailedAttempts: 5, durationSeconds: 15 * 60 },
    }),
    nextCookies(), // precisa ser o último plugin
  ],
});

export type Sessao = typeof auth.$Infer.Session;
