import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { areaDoPapel } from "@/modules/auth/papeis";
import { obterSessao } from "@/modules/auth/sessao";
import { BotaoSair } from "../../_components/botao-sair";
import { obterIdioma } from "@/i18n/servidor";
import { SiteHeader } from "../../_components/site-header";
import { FormFicha } from "./form-ficha";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obterIdioma()) === "en" ? "My details — LPZ Training" : "Meus dados — LPZ Training" };
}

// Ficha do congressista: obrigatória no primeiro acesso (e-mail/senha ou
// Google) e usada depois para corrigir os dados (direito do titular — LGPD).
export default async function Page() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas");
  const { user } = sessao;
  if (user.papel !== "congressista") redirect(areaDoPapel(user.papel));

  const primeiraVez = !user.cadastroCompletoEm;
  const en = (await obterIdioma()) === "en";
  const primeiroNome = user.name.split(" ")[0];

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-xl">
          <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal">
            {primeiraVez ? (en ? "Complete your sign-up" : "Complete seu cadastro") : en ? "My details" : "Meus dados"}
          </h1>
          <p className="mt-4 text-mist/90">
            {en
              ? primeiraVez
                ? `Hi, ${primeiroNome}! Almost done: we need a few details to issue your ticket and organize the event.`
                : "Check and correct your details whenever you need."
              : primeiraVez
                ? `Olá, ${primeiroNome}! Falta pouco: precisamos de alguns dados para emitir seu ingresso e organizar o evento.`
                : "Confira e corrija seus dados sempre que precisar."}
          </p>

          <div className="mt-8">
            <FormFicha
              precisaAceite={!user.privacidadeAceitaEm}
              valores={{
                nome: user.name,
                email: user.email,
                dataNascimento: user.dataNascimento ?? "",
                celular: user.celular ?? "",
                pais: user.pais ?? "",
                uf: user.uf ?? "",
                cidade: user.cidade ?? "",
                cpf: user.cpf ?? "",
                cep: user.cep ?? "",
                logradouro: user.logradouro ?? "",
                numero: user.numero ?? "",
                complemento: user.complemento ?? "",
                bairro: user.bairro ?? "",
                naturalidadeCidade: user.naturalidadeCidade ?? "",
                naturalidadeEstado: user.naturalidadeEstado ?? "",
                comoConheceu: user.comoConheceu ?? "",
              }}
            />
          </div>

          <div className="mt-8">
            <BotaoSair destino="/congressistas" />
          </div>
        </div>
      </main>
    </>
  );
}
