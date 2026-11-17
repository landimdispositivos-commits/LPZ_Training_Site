import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/modules/auth/auth";
import { areaDoPapel } from "@/modules/auth/papeis";
import { SiteHeader } from "../../_components/site-header";
import { BotaoSair } from "../../_components/botao-sair";
import { MeusIngressos } from "../_components/meus-ingressos";

export const metadata: Metadata = { title: "Minha área — LPZ Training" };

// Mostra só os 3 primeiros dígitos: a tela pode estar à vista de outras pessoas.
function mascararCpf(cpf: string) {
  return `${cpf.slice(0, 3)}.***.***-**`;
}

// "AAAA-MM-DD" → "DD/MM/AAAA" (sem passar por Date, para não sofrer com fuso).
function formatarData(data: string) {
  const [a, m, d] = data.split("-");
  return `${d}/${m}/${a}`;
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

  const local = [user.cidade, user.uf ?? (user.pais !== "Brasil" ? user.pais : null)].filter(Boolean).join(" — ");
  const endereco = user.logradouro
    ? [`${user.logradouro}, ${user.numero}`, user.complemento, user.bairro, user.cep].filter(Boolean).join(" · ")
    : null;
  const naturalidade = [user.naturalidadeCidade, user.naturalidadeEstado].filter(Boolean).join(" — ");

  const dados = [
    { rotulo: "Nome", valor: user.name },
    { rotulo: "E-mail", valor: user.email },
    { rotulo: "Nascimento", valor: user.dataNascimento ? formatarData(user.dataNascimento) : "—" },
    { rotulo: "Celular", valor: user.celular ?? "—" },
    { rotulo: "Mora em", valor: local || "—" },
    ...(user.cpf ? [{ rotulo: "CPF", valor: mascararCpf(user.cpf) }] : []),
    ...(endereco ? [{ rotulo: "Endereço", valor: endereco }] : []),
    ...(naturalidade ? [{ rotulo: "Naturalidade", valor: naturalidade }] : []),
    ...(user.comoConheceu ? [{ rotulo: "Como conheceu", valor: user.comoConheceu }] : []),
  ];

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-lg">
          <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal">Minha área</h1>
          {bemvindo && (
            <p role="status" className="mt-4 rounded-lg border border-teal-400/50 bg-teal-400/10 px-4 py-3 text-sm">
              Cadastro concluído. Bem-vindo(a) ao LPZ Training!
            </p>
          )}
          {atualizado && !bemvindo && (
            <p role="status" className="mt-4 rounded-lg border border-teal-400/50 bg-teal-400/10 px-4 py-3 text-sm">
              Seus dados foram atualizados.
            </p>
          )}
          {pago && (
            <p role="status" className="mt-4 rounded-lg border border-teal-400/50 bg-teal-400/10 px-4 py-3 text-sm">
              Pagamento confirmado! Seu ingresso está logo abaixo.
            </p>
          )}
          <p className="mt-4 text-mist/90">Olá, {user.name.split(" ")[0]}!</p>

          <section className="mt-8 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Meus dados</h2>
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
              Editar meus dados
            </Link>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Meus ingressos</h2>
            <MeusIngressos email={user.email} />
          </section>

          <div className="mt-8">
            <BotaoSair destino="/congressistas" />
          </div>
        </div>
      </main>
    </>
  );
}
