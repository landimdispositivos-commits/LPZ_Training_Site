import type { Metadata } from "next";
import Link from "next/link";
import { traducoes, tx } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { obterSessao } from "@/modules/auth/sessao";
import { linkWhatsapp, obterContatos } from "@/modules/contato";
import { linkInstagram } from "@/modules/perfis";
import { Aviso, Campo, classeBotao, classeInput } from "../_components/form-ui";
import { PaginaPublica } from "../_components/pagina-publica";
import { podeEditar } from "../_components/perfis";
import { RodapeSite } from "../_components/rodape-site";
import { SiteHeader } from "../_components/site-header";
import { salvarContatosAction } from "./actions";
import { FormContato } from "./form-contato";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Fale conosco — LPZ Training", "Contact us — LPZ Training", "Contáctanos — LPZ Training") };
}

export const dynamic = "force-dynamic";

const TEXTOS = traducoes(
  {
    titulo: "Fale conosco",
    subtitulo: "Dúvidas, sugestões ou reclamações sobre cronograma, professores, DJs, ingressos ou qualquer parte do congresso. Escreva para a gente.",
    escreva: "Envie sua mensagem",
    contatos: "Nossos contatos",
    email: "E-mail",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    emBreve: "Contatos em breve.",
    editar: "Editar contatos",
    editando: "Editar contatos (só a organização vê)",
    dicaEmail: "As mensagens do formulário chegam neste e-mail.",
    dicaWhats: "Com DDD, ex.: (11) 91234-5678.",
    salvar: "Salvar",
    salvo: "Operação realizada com sucesso!",
    erro: "Confira os campos: e-mail válido, WhatsApp só com números e Instagram só com letras, números, ponto e _.",
  },
  {
    titulo: "Contact us",
    subtitulo: "Questions, suggestions or complaints about the schedule, teachers, DJs, tickets or any part of the congress. Write to us.",
    escreva: "Send us a message",
    contatos: "Our contacts",
    email: "Email",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    emBreve: "Contacts coming soon.",
    editar: "Edit contacts",
    editando: "Edit contacts (organizers only)",
    dicaEmail: "Messages from the form are sent to this email.",
    dicaWhats: "With area code, e.g. (11) 91234-5678.",
    salvar: "Save",
    salvo: "Saved successfully!",
    erro: "Check the fields: valid email, WhatsApp with numbers only and Instagram with letters, numbers, dot and _ only.",
  },
  {
    titulo: "Contáctanos",
    subtitulo: "Dudas, sugerencias o reclamos sobre el cronograma, profesores, DJs, entradas o cualquier parte del congreso. Escríbenos.",
    escreva: "Envíanos tu mensaje",
    contatos: "Nuestros contactos",
    email: "Correo",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    emBreve: "Contactos próximamente.",
    editar: "Editar contactos",
    editando: "Editar contactos (solo la organización lo ve)",
    dicaEmail: "Los mensajes del formulario llegan a este correo.",
    dicaWhats: "Con código de área, ej.: (11) 91234-5678.",
    salvar: "Guardar",
    salvo: "¡Guardado con éxito!",
    erro: "Revisa los campos: correo válido, WhatsApp solo con números e Instagram solo con letras, números, punto y _.",
  },
);

const classeCaixa = "rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-6";

export default async function Page(props: PageProps<"/fale-conosco">) {
  const busca = await props.searchParams;
  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const [contatos, editavel, sessao] = await Promise.all([obterContatos(), podeEditar(), obterSessao().catch(() => null)]);

  const whats = linkWhatsapp(contatos.whatsapp);
  const insta = linkInstagram(contatos.instagram);
  const itens = [
    contatos.email && { rotulo: t.email, texto: contatos.email, href: `mailto:${contatos.email}` },
    whats && { rotulo: t.whatsapp, texto: contatos.whatsapp!, href: whats },
    insta && { rotulo: t.instagram, texto: contatos.instagram!, href: insta },
  ].filter(Boolean) as { rotulo: string; texto: string; href: string }[];

  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={t.titulo} subtitulo={t.subtitulo} largura="max-w-5xl">
        {busca.salvo && <Aviso tipo="ok">{t.salvo}</Aviso>}
        {busca.erro && <Aviso tipo="erro">{t.erro}</Aviso>}
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <section className={classeCaixa}>
            <h2 className="mb-4 font-display text-sm uppercase tracking-[0.15em] text-gold-300">{t.escreva}</h2>
            <FormContato nome={sessao?.user.name} email={sessao?.user.email} />
          </section>

          <section id="contatos" className={`${classeCaixa} relative scroll-mt-24 pb-16`}>
            <h2 className="font-display text-sm uppercase tracking-[0.15em] text-gold-300">{t.contatos}</h2>
            {itens.length === 0 ? (
              <p className="mt-4 text-sm text-mist/70">{t.emBreve}</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {itens.map((c) => (
                  <li key={c.rotulo}>
                    <p className="text-xs uppercase tracking-wider text-mist/60">{c.rotulo}</p>
                    <a href={c.href} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-teal-300 hover:underline">
                      {c.texto}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {editavel && (
              <Link
                href="/fale-conosco?editar=1#editar-contatos"
                className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/30"
              >
                <span aria-hidden="true">✎</span> {t.editar}
              </Link>
            )}
          </section>
        </div>

        {editavel && busca.editar === "1" && (
          <form id="editar-contatos" action={salvarContatosAction} className={`${classeCaixa} scroll-mt-24 space-y-4`}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">{t.editando}</h2>
            <Campo id="cfg-email" label={t.email} dica={t.dicaEmail}>
              <input id="cfg-email" name="contato_email" type="email" maxLength={200} defaultValue={contatos.email ?? ""} className={classeInput} />
            </Campo>
            <Campo id="cfg-whats" label={t.whatsapp} dica={t.dicaWhats}>
              <input id="cfg-whats" name="contato_whatsapp" maxLength={30} defaultValue={contatos.whatsapp ?? ""} className={classeInput} />
            </Campo>
            <Campo id="cfg-insta" label={t.instagram}>
              <input id="cfg-insta" name="contato_instagram" maxLength={31} defaultValue={contatos.instagram ?? ""} placeholder="@perfil" className={classeInput} />
            </Campo>
            <button type="submit" className={classeBotao}>{t.salvar}</button>
          </form>
        )}
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
