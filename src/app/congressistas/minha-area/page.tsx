import { comoChamar } from "@/modules/perfil/apelido";
import { CampoApelido } from "@/app/_components/campo-apelido";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/modules/auth/auth";
import { areaDoPapel } from "@/modules/auth/papeis";
import { atualizarPendentesDoComprador } from "@/modules/ingressos";
import { SiteHeader } from "../../_components/site-header";
import { traducoes, tx } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { BotaoSair } from "../../_components/botao-sair";
import { MeusIngressos } from "../_components/meus-ingressos";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Minha área — LPZ Training", "My area — LPZ Training", "Mi área — LPZ Training") };
}

const TEXTOS = traducoes(
  {
    titulo: "Minha área",
    bemvindo: "Cadastro concluído. Bem-vindo(a) ao LPZ Training!",
    atualizado: "Seus dados foram atualizados.",
    pago: "Pagamento confirmado! Seu ingresso está logo abaixo.",
    ola: "Olá",
    meusDados: "Meus dados",
    editar: "Editar meus dados",
    meusIngressos: "Meus ingressos",
    nome: "Nome",
    email: "E-mail",
    nascimento: "Nascimento",
    celular: "Celular",
    moraEm: "Mora em",
    endereco: "Endereço",
    naturalidade: "Naturalidade",
    comoConheceu: "Como conheceu",
  },
  {
    titulo: "My area",
    bemvindo: "Sign-up complete. Welcome to LPZ Training!",
    atualizado: "Your details have been updated.",
    pago: "Payment confirmed! Your ticket is right below.",
    ola: "Hi",
    meusDados: "My details",
    editar: "Edit my details",
    meusIngressos: "My tickets",
    nome: "Name",
    email: "Email",
    nascimento: "Date of birth",
    celular: "Mobile",
    moraEm: "Lives in",
    endereco: "Address",
    naturalidade: "Place of birth",
    comoConheceu: "How you heard about us",
  },
  {
    titulo: "Mi área",
    bemvindo: "Registro completo. ¡Bienvenido(a) a LPZ Training!",
    atualizado: "Tus datos fueron actualizados.",
    pago: "¡Pago confirmado! Tu entrada está justo abajo.",
    ola: "Hola",
    meusDados: "Mis datos",
    editar: "Editar mis datos",
    meusIngressos: "Mis entradas",
    nome: "Nombre",
    email: "Correo",
    nascimento: "Fecha de nacimiento",
    celular: "Celular",
    moraEm: "Vive en",
    endereco: "Dirección",
    naturalidade: "Lugar de nacimiento",
    comoConheceu: "Cómo nos conociste",
  },
);

// Mostra só os 3 primeiros dígitos: a tela pode estar à vista de outras pessoas.
function mascararCpf(cpf: string) {
  return `${cpf.slice(0, 3)}.***.***-**`;
}

// "AAAA-MM-DD" → "DD/MM/AAAA" (sem passar por Date, para não sofrer com fuso).
function formatarData(data: string, en: boolean) {
  const [a, m, d] = data.split("-");
  return en ? `${m}/${d}/${a}` : `${d}/${m}/${a}`;
}

export default async function Page(props: PageProps<"/congressistas/minha-area">) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  const { bemvindo, atualizado, pago, error } = await props.searchParams;

  // Link de confirmação inválido/expirado chega aqui com ?error=...
  if (!sessao) redirect(error ? "/congressistas?erro=link" : "/congressistas");

  const { user } = sessao;
  if (user.papel !== "congressista") redirect(areaDoPapel(user.papel));
  // Ficha obrigatória antes da área logada (cadastro novo ou pelo Google).
  if (!user.cadastroCompletoEm) redirect("/congressistas/completar-cadastro");
  // Pix pago depois de fechar o checkout: confere no gateway antes de mostrar.
  await atualizarPendentesDoComprador(user.email);

  const local = [user.cidade, user.uf ?? (user.pais !== "Brasil" ? user.pais : null)].filter(Boolean).join(" — ");
  const endereco = user.logradouro
    ? [`${user.logradouro}, ${user.numero}`, user.complemento, user.bairro, user.cep].filter(Boolean).join(" · ")
    : null;
  const naturalidade = [user.naturalidadeCidade, user.naturalidadeEstado].filter(Boolean).join(" — ");
  const idioma = await obterIdioma();
  const en = idioma === "en"; // datas em mês/dia só em inglês
  const t = TEXTOS[idioma];

  const dados = [
    { rotulo: t.nome, valor: user.name },
    { rotulo: t.email, valor: user.email },
    { rotulo: t.nascimento, valor: user.dataNascimento ? formatarData(user.dataNascimento, en) : "—" },
    { rotulo: t.celular, valor: user.celular ?? "—" },
    { rotulo: t.moraEm, valor: local || "—" },
    ...(user.cpf ? [{ rotulo: "CPF", valor: mascararCpf(user.cpf) }] : []),
    ...(endereco ? [{ rotulo: t.endereco, valor: endereco }] : []),
    ...(naturalidade ? [{ rotulo: t.naturalidade, valor: naturalidade }] : []),
    ...(user.comoConheceu ? [{ rotulo: t.comoConheceu, valor: user.comoConheceu }] : []),
  ];

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-lg">
          <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal">{t.titulo}</h1>
          {bemvindo && (
            <p role="status" className="mt-4 rounded-lg border border-teal-400/50 bg-teal-400/10 px-4 py-3 text-sm">
              {t.bemvindo}
            </p>
          )}
          {atualizado && !bemvindo && (
            <p role="status" className="mt-4 rounded-lg border border-teal-400/50 bg-teal-400/10 px-4 py-3 text-sm">
              {t.atualizado}
            </p>
          )}
          {pago && (
            <p role="status" className="mt-4 rounded-lg border border-teal-400/50 bg-teal-400/10 px-4 py-3 text-sm">
              {t.pago}
            </p>
          )}
          <p className="mt-4 text-mist/90">{t.ola}, {comoChamar(user)}!</p>

          <section className="mt-8 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">{t.meusDados}</h2>
            <dl className="mt-4 space-y-3">
              {dados.map((d) => (
                <div key={d.rotulo} className="flex justify-between gap-4 border-b border-white/5 pb-2 text-sm">
                  <dt className="text-mist/60">{d.rotulo}</dt>
                  <dd className="text-right text-white">{d.valor}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/congressistas/completar-cadastro"
              className="mt-5 inline-block text-sm font-medium text-teal-300 hover:underline"
            >
              {t.editar}
            </Link>
          </section>

          <CampoApelido apelido={user.apelido ?? null} primeiroNome={user.name.split(" ")[0]} />

          <section className="mt-6 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">{t.meusIngressos}</h2>
            <MeusIngressos email={user.email} idioma={idioma} />
          </section>

          <div className="mt-8">
            <BotaoSair destino="/congressistas" />
          </div>
        </div>
      </main>
    </>
  );
}
