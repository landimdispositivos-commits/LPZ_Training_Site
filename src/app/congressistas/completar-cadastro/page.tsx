import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { areaDoPapel } from "@/modules/auth/papeis";
import { obterSessao } from "@/modules/auth/sessao";
import { BotaoSair } from "../../_components/botao-sair";
import { SiteHeader } from "../../_components/site-header";
import { FormFicha } from "./form-ficha";

export const metadata: Metadata = { title: "Meus dados — LPZ Training" };

// Ficha do congressista: obrigatória no primeiro acesso (e-mail/senha ou
// Google) e usada depois para corrigir os dados (direito do titular — LGPD).
export default async function Page() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas");
  const { user } = sessao;
  if (user.papel !== "congressista") redirect(areaDoPapel(user.papel));

  const primeiraVez = !user.cadastroCompletoEm;

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-xl">
          <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal">
            {primeiraVez ? "Complete seu cadastro" : "Meus dados"}
          </h1>
          <p className="mt-4 text-mist/90">
            {primeiraVez
              ? `Olá, ${user.name.split(" ")[0]}! Falta pouco: precisamos de alguns dados para emitir seu ingresso e organizar o evento.`
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
