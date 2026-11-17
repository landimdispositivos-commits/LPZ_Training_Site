import type { Metadata } from "next";
import { obterIdioma } from "@/i18n/servidor";
import { SiteHeader } from "../_components/site-header";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obterIdioma()) === "en" ? "Privacy Policy — LPZ Training" : "Política de Privacidade — LPZ Training" };
}

const classeArtigo =
  "mx-auto max-w-2xl space-y-6 text-mist/90 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gold-300 [&_li]:ml-5 [&_li]:list-disc";

// RASCUNHO — texto precisa de revisão da organização (idealmente com
// orientação jurídica) antes do lançamento. Trechos entre [colchetes] são
// dados a preencher.
function ConteudoPt() {
  return (
    <article className={classeArtigo}>
      <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal">
        Política de Privacidade
      </h1>
      <p className="rounded-lg border border-ember-500/50 bg-ember-500/10 px-4 py-3 text-sm">
        Rascunho em revisão. Última atualização: [data].
      </p>

      <p>
        Esta política explica como o LPZ Training ([nome/razão social do responsável], [CNPJ ou
        CPF]) trata os dados pessoais de quem se cadastra no site, conforme a Lei Geral de
        Proteção de Dados (Lei 13.709/2018 — LGPD).
      </p>

      <h2>Quais dados coletamos e por quê</h2>
      <ul className="space-y-2">
        <li><strong className="text-white">Nome e e-mail</strong> — identificar você, dar acesso à sua conta e enviar comunicações sobre o seu ingresso e o evento.</li>
        <li><strong className="text-white">Celular</strong> — contato sobre o evento (ex: mudanças de horário) e suporte.</li>
        <li><strong className="text-white">CPF</strong> (só para quem mora no Brasil) — exigido pelo Mercado Pago para processar o pagamento do ingresso.</li>
        <li><strong className="text-white">Estado ou país e cidade onde mora</strong> — organização do evento (ex: saber de onde vêm os participantes).</li>
        <li><strong className="text-white">Data de nascimento</strong> — confirmar a idade do participante (regras de acesso ao evento e de compra do ingresso).</li>
        <li><strong className="text-white">Endereço</strong> (opcional) — envio de materiais do evento, quando houver. Você pode deixar em branco.</li>
        <li><strong className="text-white">Cidade e estado/país de nascimento</strong> (opcional) — estatística sobre o público do evento. Você pode deixar em branco.</li>
        <li><strong className="text-white">Como conheceu o LPZ</strong> (opcional) — saber quais canais de divulgação funcionam.</li>
        <li><strong className="text-white">Login com Google</strong> (se você escolher) — recebemos do Google apenas seu nome, e-mail e foto de perfil. Não temos acesso à sua senha do Google nem a outros dados da sua conta.</li>
        <li><strong className="text-white">Dados técnicos de acesso</strong> (endereço IP e navegador) — segurança da conta e prevenção de fraudes.</li>
      </ul>
      <p>
        Não pedimos dados sensíveis e não usamos seus dados para marketing sem o seu
        consentimento específico. Sua senha é armazenada de forma criptografada (hash) e ninguém
        da organização tem acesso a ela.
      </p>

      <h2>Base legal</h2>
      <p>
        Tratamos esses dados para executar o contrato de compra do ingresso e os procedimentos
        que o antecedem (art. 7º, V, da LGPD), para cumprir obrigações legais (art. 7º, II) e,
        no caso dos dados técnicos de acesso, por legítimo interesse na segurança do site
        (art. 7º, IX). Os dados marcados como opcionais são tratados com base no seu
        consentimento (art. 7º, I), que você pode revogar a qualquer momento apagando-os em
        Minha área → Editar meus dados.
      </p>

      <h2>Com quem compartilhamos</h2>
      <ul className="space-y-2">
        <li><strong className="text-white">Mercado Pago</strong> — processamento do pagamento. Os dados do seu cartão são informados diretamente ao Mercado Pago; o LPZ Training não os recebe nem armazena.</li>
        <li><strong className="text-white">Google</strong> — só se você escolher entrar com o Google: ele confirma sua identidade e nos informa nome, e-mail e foto.</li>
        <li><strong className="text-white">Provedores de infraestrutura</strong> — hospedagem do site e envio de e-mails, apenas para operar o serviço.</li>
      </ul>
      <p>Não vendemos seus dados.</p>

      <h2>Por quanto tempo guardamos</h2>
      <p>
        Enquanto sua conta estiver ativa. Dados ligados a pagamentos podem ser mantidos pelo
        prazo exigido pela legislação fiscal, mesmo após a exclusão da conta. [Definir prazo.]
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode, a qualquer momento, pedir: confirmação e acesso aos seus dados, correção,
        exclusão, informação sobre compartilhamento e revogação de consentimento (art. 18 da
        LGPD). Você mesmo pode corrigir seus dados em Minha área → Editar meus dados. Para os
        demais pedidos, escreva para <strong className="text-white">[e-mail de contato de
        privacidade]</strong>. Respondemos em até 15 dias.
      </p>

      <h2>Contato</h2>
      <p>Dúvidas sobre esta política: [e-mail de contato de privacidade].</p>
    </article>
  );
}

// Versão em inglês (tradução do rascunho acima; a versão em português é a de referência).
function ConteudoEn() {
  return (
    <article className={classeArtigo}>
      <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal">Privacy Policy</h1>
      <p className="rounded-lg border border-ember-500/50 bg-ember-500/10 px-4 py-3 text-sm">
        Draft under review. Last updated: [date]. In case of doubt, the Portuguese version prevails.
      </p>

      <p>
        This policy explains how LPZ Training ([name/legal name of the controller], [CNPJ or CPF]) handles the
        personal data of people who sign up on this site, under Brazil&apos;s General Data Protection Law (Law
        13.709/2018 — LGPD).
      </p>

      <h2>What data we collect and why</h2>
      <ul className="space-y-2">
        <li><strong className="text-white">Name and email</strong> — to identify you, give you access to your account and send you messages about your ticket and the event.</li>
        <li><strong className="text-white">Mobile phone</strong> — contact about the event (e.g. schedule changes) and support.</li>
        <li><strong className="text-white">CPF</strong> (only for people living in Brazil) — required by Mercado Pago to process the ticket payment.</li>
        <li><strong className="text-white">State or country and city where you live</strong> — event planning (e.g. knowing where attendees come from).</li>
        <li><strong className="text-white">Date of birth</strong> — to confirm the attendee&apos;s age (event access and ticket purchase rules).</li>
        <li><strong className="text-white">Address</strong> (optional) — to send event materials, when there are any. You can leave it blank.</li>
        <li><strong className="text-white">City and state/country of birth</strong> (optional) — statistics about the event audience. You can leave it blank.</li>
        <li><strong className="text-white">How you heard about LPZ</strong> (optional) — to learn which promotion channels work.</li>
        <li><strong className="text-white">Sign in with Google</strong> (if you choose it) — we receive from Google only your name, email and profile photo. We have no access to your Google password or any other data in your account.</li>
        <li><strong className="text-white">Technical access data</strong> (IP address and browser) — account security and fraud prevention.</li>
      </ul>
      <p>
        We do not ask for sensitive data and we do not use your data for marketing without your specific
        consent. Your password is stored encrypted (hashed) and no one in the organization has access to it.
      </p>

      <h2>Legal basis</h2>
      <p>
        We process this data to perform the ticket purchase contract and the steps that come before it (art. 7,
        V, LGPD), to comply with legal obligations (art. 7, II) and, for technical access data, based on our
        legitimate interest in the site&apos;s security (art. 7, IX). Data marked as optional is processed based
        on your consent (art. 7, I), which you can withdraw at any time by deleting it in My area → Edit my
        details.
      </p>

      <h2>Who we share it with</h2>
      <ul className="space-y-2">
        <li><strong className="text-white">Mercado Pago</strong> — payment processing. Your card details are entered directly at Mercado Pago; LPZ Training neither receives nor stores them.</li>
        <li><strong className="text-white">Google</strong> — only if you choose to sign in with Google: it confirms your identity and tells us your name, email and photo.</li>
        <li><strong className="text-white">Infrastructure providers</strong> — site hosting and email delivery, only to run the service.</li>
      </ul>
      <p>We do not sell your data.</p>

      <h2>How long we keep it</h2>
      <p>
        While your account is active. Payment-related data may be kept for the period required by tax law, even
        after the account is deleted. [Define period.]
      </p>

      <h2>Your rights</h2>
      <p>
        At any time you can request: confirmation of and access to your data, correction, deletion, information
        about sharing and withdrawal of consent (art. 18, LGPD). You can correct your data yourself in My area →
        Edit my details. For other requests, write to{" "}
        <strong className="text-white">[privacy contact email]</strong>. We reply within 15 days.
      </p>

      <h2>Contact</h2>
      <p>Questions about this policy: [privacy contact email].</p>
    </article>
  );
}

export default async function Page() {
  const en = (await obterIdioma()) === "en";
  return (
    <>
      <SiteHeader />
      <main className="px-4 py-16">{en ? <ConteudoEn /> : <ConteudoPt />}</main>
    </>
  );
}
