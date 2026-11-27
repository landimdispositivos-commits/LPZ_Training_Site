// Conteúdo da Política de Privacidade nos três idiomas. A versão em português é
// a de referência. Trechos entre [colchetes] são dados que a organização precisa
// preencher ou confirmar (de preferência com orientação jurídica) antes de publicar.

export type Secao = {
  h: string;
  p?: string[];
  li?: [string, string][];
  depois?: string[];
};

export type Politica = {
  titulo: string;
  aviso: string;
  intro: string[];
  secoes: Secao[];
};

const PT: Politica = {
  titulo: "Política de Privacidade",
  aviso:
    "Versão 2.0 — 27/11/2026. Texto em revisão jurídica: os trechos entre [colchetes] serão preenchidos pela organização antes da publicação.",
  intro: [
    "Esta política explica como o LPZ Training ([razão social do responsável], [CNPJ ou CPF], [endereço]) — o controlador dos dados — coleta, usa, compartilha e protege os dados pessoais de quem usa este site, compra ingressos, usa o Bar e participa dos eventos, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).",
    "Escrevemos de forma simples de propósito. Se algo não ficar claro, fale com a gente (veja “Contato e encarregado”).",
  ],
  secoes: [
    {
      h: "1. Quais dados coletamos e por quê",
      li: [
        ["Cadastro: nome, e-mail, celular, data de nascimento, CPF (só para quem mora no Brasil), país/UF/cidade", "criar e proteger a sua conta, emitir e conferir ingressos, falar sobre o evento (ex.: mudança de horário), emitir cobrança e cumprir obrigações legais e fiscais. O CPF é exigido pelo gateway de pagamento. A data de nascimento confirma a idade (regras de acesso e de venda de bebidas alcoólicas)."],
        ["Dados opcionais: endereço, cidade e estado/país de nascimento, “como conheceu o LPZ”, apelido e foto de perfil", "organização do evento, estatísticas e personalização. Você pode deixar em branco, alterar ou apagar quando quiser."],
        ["Compras (ingressos, produtos e serviços)", "registrar o que foi comprado, valor, forma de pagamento (Pix, crédito, débito), parcelas, situação do pagamento, cancelamentos e estornos, e emitir seus QR codes."],
        ["Bar: pedidos feitos pelo site, itens, valores, tickets (QR), retiradas no balcão e, se você escolher, seu cartão salvo (somente bandeira, 4 últimos dígitos e identificador — veja a seção 3)", "processar o pedido, entregar o que você comprou e comprovar o que foi entregue. As comandas (pulseira ou cartão com número) não são ligadas a você: registram apenas o número, os itens e o pagamento."],
        ["Presença no evento (check-in e retiradas)", "controlar a entrada e a entrega de produtos e serviços, evitando uso duplicado de ingressos e tickets."],
        ["Login com Google (opcional)", "se você escolher entrar com o Google, recebemos apenas nome, e-mail e foto. Não temos acesso à sua senha do Google nem a outros dados da sua conta."],
        ["Mensagens: Fale conosco e “Reportar problema”", "responder você e corrigir erros. O “Reportar problema” envia à organização um print da tela, a página, o navegador e registros de erro; o print pode mostrar dados seus. Senhas nunca são incluídas."],
        ["Dados técnicos: endereço IP, navegador, data e hora de acessos e ações importantes", "segurança da conta, prevenção de fraudes e trilha de auditoria (quem fez o quê e quando)."],
      ],
      depois: [
        "Não pedimos dados pessoais sensíveis (como saúde, religião ou biometria). Sua senha é guardada de forma criptografada (hash) e ninguém da organização consegue ver. Não vendemos seus dados e não tomamos decisões exclusivamente automatizadas que afetem você.",
      ],
    },
    {
      h: "2. Para que usamos (finalidades) e em que base legal",
      li: [
        ["Execução de contrato (art. 7º, V)", "criar a conta, vender e entregar ingressos, produtos e serviços do Bar, processar pagamentos, cancelamentos e estornos."],
        ["Obrigação legal ou regulatória (art. 7º, II)", "guardar registros fiscais e de venda, atender o direito do consumidor e ordens de autoridades."],
        ["Legítimo interesse (art. 7º, IX)", "segurança do site, prevenção de fraude, trilha de auditoria, limite de tentativas de login e estatísticas simples do evento, sempre com o mínimo de dados e respeitando seus direitos."],
        ["Exercício regular de direitos (art. 7º, VI)", "guardar provas de compra, de pagamento e de entrega (por exemplo, quantas unidades de um pedido foram retiradas) para o caso de contestação."],
        ["Consentimento (art. 7º, I)", "dados opcionais, foto de perfil, cartão salvo e comunicações promocionais. Você pode revogar a qualquer momento, sem prejuízo do que já foi tratado."],
      ],
    },
    {
      h: "3. Pagamentos e cartões",
      p: [
        "Os pagamentos são processados pelo Mercado Pago. Os dados do cartão são digitados diretamente na página ou nos campos seguros do Mercado Pago: o LPZ Training não recebe, não vê e não guarda o número completo do cartão, a validade nem o código de segurança (CVV). O Mercado Pago atua como controlador próprio dos dados de pagamento, segundo a política dele.",
        "Cartão salvo (opcional): se você autorizar, o cartão fica guardado no Mercado Pago e nós guardamos apenas um identificador seguro, a bandeira, os 4 últimos dígitos e a validade (MM/AA, para avisar se venceu), além da data do seu consentimento. Em cada compra você digita só o código de segurança. Você pode remover o cartão quando quiser em Bar → Meus cartões, e ele também é removido se a sua conta for excluída.",
        "Nunca pediremos senha, número de cartão ou código por e-mail, WhatsApp ou telefone.",
      ],
    },
    {
      h: "4. Com quem compartilhamos",
      li: [
        ["Mercado Pago", "pagamento, estorno e cartão salvo."],
        ["Google", "somente se você escolher entrar com o Google."],
        ["Provedor de envio de e-mails ([Brevo — confirmar])", "enviar confirmação de conta, ingresso, avisos e respostas."],
        ["Hospedagem e proteção do site ([provedor de VPS] e Cloudflare)", "manter o site no ar, proteger contra ataques e entregar páginas com rapidez. O tráfego passa por esses provedores."],
        ["Equipe e profissionais do evento", "só quem precisa e só o necessário para a função: portaria confere ingressos, balcão e caixa do Bar veem pedidos e tickets, e a organização acessa cadastros para dar suporte. O acesso é por perfil e fica registrado."],
        ["Autoridades e assessores", "quando exigido por lei ou ordem judicial, e contadores e advogados sob sigilo."],
      ],
      depois: [
        "Alguns desses provedores podem tratar dados fora do Brasil (por exemplo, Google, Cloudflare e o provedor de e-mail). Nesses casos adotamos as garantias previstas no art. 33 da LGPD, como cláusulas contratuais e provedores com padrões reconhecidos de segurança.",
      ],
    },
    {
      h: "5. Cookies e armazenamento no seu aparelho",
      p: ["Usamos apenas o necessário para o site funcionar. Não usamos cookies de publicidade nem de rastreamento para marketing."],
      li: [
        ["Cookie de sessão (login)", "mantém você conectado e protege a conta. Essencial."],
        ["lpz_idioma", "lembra o idioma escolhido (até 1 ano). Preferência."],
        ["Sacola do Bar (armazenamento local)", "guarda no seu aparelho os itens da sacola até você pagar ou esvaziar."],
        ["Controle de compra automática (armazenamento da aba)", "evita repetir uma compra ao voltar de uma página."],
        ["Mercado Pago e Google", "ao abrir a página de pagamento ou o login deles, eles podem usar cookies próprios, sob as políticas deles."],
      ],
      depois: ["Você pode apagar cookies e dados do site no seu navegador; sem o cookie de sessão você precisará entrar de novo."],
    },
    {
      h: "6. Fotos e vídeos do evento",
      p: [
        "Os eventos têm fotógrafos e filmagem (inclusive os serviços “Paparazzi”). Imagens de público podem aparecer na Galeria e em divulgação. Se você não quiser aparecer, avise a equipe no evento ou escreva para o contato de privacidade e removeremos a imagem em prazo razoável. [Revisar com a organização: regras de uso de imagem.]",
      ],
    },
    {
      h: "7. Por quanto tempo guardamos",
      li: [
        ["Conta e cadastro", "enquanto a conta estiver ativa. Ao excluir a conta, apagamos o cadastro, a foto e os cartões salvos."],
        ["Compras, pagamentos, estornos e entregas", "por 5 anos, para obrigações fiscais, defesa do consumidor e comprovação de direitos [confirmar com o contador]. Ficam sem vínculo com o login após a exclusão da conta."],
        ["Registros técnicos de acesso e segurança", "pelo mínimo exigido em lei (6 meses) e pelo tempo necessário à segurança [definir: sugerido até 12 meses]."],
        ["Trilha de auditoria (quem alterou o quê)", "pelo tempo necessário à segurança e à prova de direitos [definir: sugerido 5 anos]. Nomes e e-mails ficam copiados para o histórico não se perder; CPF, celular, nascimento e endereço são mascarados."],
        ["Prints do “Reportar problema”", "ficam apenas nos e-mails do suporte e são apagados após a solução [definir: até 90 dias]."],
      ],
      depois: ["Passado o prazo, eliminamos ou anonimizamos os dados, salvo se a lei exigir guarda maior."],
    },
    {
      h: "8. Seus direitos",
      p: [
        "Você pode pedir, a qualquer momento e gratuitamente (art. 18 da LGPD): confirmação de que tratamos seus dados; acesso; correção de dados incompletos ou desatualizados; anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desacordo com a lei; portabilidade; informação sobre com quem compartilhamos; informação sobre a possibilidade de não consentir e suas consequências; revogação do consentimento; e oposição a tratamento feito sem consentimento quando houver descumprimento da lei.",
        "Onde fazer: você mesmo altera dados em Meu cadastro, a foto em Minha foto, os cartões em Bar → Meus cartões. Para os demais pedidos (acesso, exclusão da conta, portabilidade), escreva ao contato abaixo. Confirmaremos sua identidade e responderemos em até 15 dias.",
        "Se acreditar que seus direitos não foram respeitados, você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).",
      ],
    },
    {
      h: "9. Crianças e adolescentes",
      p: [
        "O site e as compras são destinados a maiores de 18 anos. Dados de menores só podem ser tratados com consentimento específico de um responsável (art. 14 da LGPD). A venda de bebidas alcoólicas a menores de 18 anos é proibida por lei: o Bar só vende bebida alcoólica a maiores de 18 e podemos pedir documento com foto.",
      ],
    },
    {
      h: "10. Segurança",
      p: [
        "Adotamos medidas técnicas e organizacionais para proteger seus dados — como conexão criptografada, senhas em hash, verificação em duas etapas para a equipe administrativa, controle de acesso por perfil e trilha de auditoria. Veja os detalhes na nossa Política de Segurança. Se houver um incidente de segurança que possa causar risco ou dano relevante, comunicaremos você e a ANPD nos prazos legais.",
      ],
    },
    {
      h: "11. Comunicações",
      p: [
        "Enviamos e-mails necessários ao serviço (confirmação de conta, ingresso, mudanças, cancelamentos, avisos de segurança). Mensagens promocionais só com o seu consentimento específico, com opção de cancelar em cada mensagem.",
      ],
    },
    {
      h: "12. Mudanças nesta política",
      p: ["Podemos atualizar esta política. A data e a versão ficam no topo, e mudanças relevantes serão avisadas por e-mail ou no site."],
    },
    {
      h: "13. Contato e encarregado (DPO)",
      p: [
        "Encarregado pelo tratamento de dados: [nome do encarregado]. Contato de privacidade: [e-mail de privacidade]. Contato de segurança (vulnerabilidades e incidentes): [e-mail de segurança].",
      ],
    },
  ],
};

const EN: Politica = {
  titulo: "Privacy Policy",
  aviso:
    "Version 2.0 — 11/27/2026. Text under legal review: items in [brackets] will be filled in by the organization before publication. In case of doubt, the Portuguese version prevails.",
  intro: [
    "This policy explains how LPZ Training ([legal name of the controller], [CNPJ or CPF], [address]) — the data controller — collects, uses, shares and protects the personal data of people who use this site, buy tickets, use the Bar and attend our events, under Brazil's General Data Protection Law (Law 13.709/2018 — LGPD).",
    "We wrote it in plain language on purpose. If something is unclear, contact us (see “Contact and data protection officer”).",
  ],
  secoes: [
    {
      h: "1. What data we collect and why",
      li: [
        ["Sign-up: name, email, mobile phone, date of birth, CPF (only for people living in Brazil), country/state/city", "create and protect your account, issue and check tickets, talk about the event (e.g. schedule changes), bill you and meet legal and tax duties. CPF is required by the payment gateway. Date of birth confirms age (access rules and sale of alcoholic drinks)."],
        ["Optional data: address, city and state/country of birth, “how you heard about LPZ”, nickname and profile photo", "event planning, statistics and personalization. You can leave them blank, change or delete them any time."],
        ["Purchases (tickets, products and services)", "record what was bought, amount, payment method (Pix, credit, debit), installments, payment status, cancellations and refunds, and issue your QR codes."],
        ["Bar: orders made on the site, items, amounts, tickets (QR), pickups at the counter and, if you choose, your saved card (only brand, last 4 digits and an identifier — see section 3)", "process the order, deliver what you bought and prove what was delivered. Tabs (wristband or card with a number) are not linked to you: they record only the number, items and payment."],
        ["Attendance at the event (check-in and pickups)", "control entry and delivery of products and services, preventing duplicate use of tickets."],
        ["Sign in with Google (optional)", "if you choose Google, we receive only your name, email and photo. We have no access to your Google password or other account data."],
        ["Messages: Contact us and “Report a problem”", "answer you and fix errors. “Report a problem” sends the organizers a screenshot, the page, the browser and error logs; the screenshot may show your data. Passwords are never included."],
        ["Technical data: IP address, browser, date and time of access and important actions", "account security, fraud prevention and the audit trail (who did what and when)."],
      ],
      depois: [
        "We do not ask for sensitive personal data (such as health, religion or biometrics). Your password is stored encrypted (hashed) and no one in the organization can see it. We do not sell your data and we make no decisions based solely on automated processing that affect you.",
      ],
    },
    {
      h: "2. What we use it for (purposes) and the legal basis",
      li: [
        ["Performance of a contract (art. 7, V)", "create the account, sell and deliver tickets, products and Bar services, process payments, cancellations and refunds."],
        ["Legal or regulatory obligation (art. 7, II)", "keep tax and sales records, meet consumer law and authority orders."],
        ["Legitimate interest (art. 7, IX)", "site security, fraud prevention, audit trail, login attempt limits and simple event statistics, always with minimal data and respecting your rights."],
        ["Regular exercise of rights (art. 7, VI)", "keep proof of purchase, payment and delivery (for example, how many units of an order were picked up) in case of dispute."],
        ["Consent (art. 7, I)", "optional data, profile photo, saved card and promotional messages. You can withdraw it any time, without affecting what was already processed."],
      ],
    },
    {
      h: "3. Payments and cards",
      p: [
        "Payments are processed by Mercado Pago. Card details are typed directly on Mercado Pago's page or secure fields: LPZ Training does not receive, see or store the full card number, the expiry date or the security code (CVV). Mercado Pago acts as its own controller of payment data, under its own policy.",
        "Saved card (optional): if you authorize it, the card is stored at Mercado Pago and we keep only a secure identifier, the brand, the last 4 digits and the expiry (MM/YY, to warn you if it expired), plus the date of your consent. On each purchase you type only the security code. You can remove the card any time in Bar → My cards, and it is also removed if your account is deleted.",
        "We will never ask for your password, card number or code by email, WhatsApp or phone.",
      ],
    },
    {
      h: "4. Who we share it with",
      li: [
        ["Mercado Pago", "payment, refund and saved card."],
        ["Google", "only if you choose to sign in with Google."],
        ["Email delivery provider ([Brevo — confirm])", "send account confirmation, ticket, notices and replies."],
        ["Hosting and site protection ([VPS provider] and Cloudflare)", "keep the site online, protect it from attacks and deliver pages quickly. Traffic goes through these providers."],
        ["Event staff and professionals", "only those who need it and only what the role requires: the door checks tickets, the Bar counter and cashier see orders and tickets, and the organization accesses records to give support. Access is by role and is logged."],
        ["Authorities and advisors", "when required by law or court order, and accountants and lawyers under confidentiality."],
      ],
      depois: [
        "Some of these providers may process data outside Brazil (for example Google, Cloudflare and the email provider). In those cases we adopt the safeguards in art. 33 of the LGPD, such as contractual clauses and providers with recognized security standards.",
      ],
    },
    {
      h: "5. Cookies and storage on your device",
      p: ["We use only what is needed for the site to work. We do not use advertising or marketing tracking cookies."],
      li: [
        ["Session cookie (login)", "keeps you signed in and protects the account. Essential."],
        ["lpz_idioma", "remembers your chosen language (up to 1 year). Preference."],
        ["Bar bag (local storage)", "keeps the items of your bag on your device until you pay or empty it."],
        ["Auto-purchase control (tab storage)", "avoids repeating a purchase when you come back from a page."],
        ["Mercado Pago and Google", "when you open their payment or login page, they may use their own cookies, under their policies."],
      ],
      depois: ["You can clear cookies and site data in your browser; without the session cookie you will need to sign in again."],
    },
    {
      h: "6. Event photos and videos",
      p: [
        "Our events have photographers and filming (including the “Paparazzi” services). Images of the audience may appear in the Gallery and in promotion. If you do not want to appear, tell the staff at the event or write to the privacy contact and we will remove the image within a reasonable time. [Review with the organization: image use rules.]",
      ],
    },
    {
      h: "7. How long we keep it",
      li: [
        ["Account and sign-up data", "while the account is active. When you delete the account, we delete the profile, the photo and the saved cards."],
        ["Purchases, payments, refunds and deliveries", "for 5 years, for tax duties, consumer protection and proof of rights [confirm with the accountant]. They stay unlinked from the login after the account is deleted."],
        ["Technical access and security logs", "for the minimum required by law (6 months) and as long as needed for security [define: suggested up to 12 months]."],
        ["Audit trail (who changed what)", "as long as needed for security and proof of rights [define: suggested 5 years]. Names and emails are copied so the history is not lost; CPF, phone, birth date and address are masked."],
        ["“Report a problem” screenshots", "stay only in support emails and are deleted after the fix [define: up to 90 days]."],
      ],
      depois: ["After that period we delete or anonymize the data, unless the law requires keeping it longer."],
    },
    {
      h: "8. Your rights",
      p: [
        "At any time and free of charge (art. 18, LGPD) you can request: confirmation that we process your data; access; correction of incomplete or outdated data; anonymization, blocking or deletion of unnecessary data or data processed in breach of the law; portability; information about who we share it with; information about the possibility of not consenting and its consequences; withdrawal of consent; and objection to processing done without consent where the law is breached.",
        "Where to do it: you change your data in My details, your photo in My photo and your cards in Bar → My cards. For other requests (access, account deletion, portability), write to the contact below. We will confirm your identity and reply within 15 days.",
        "If you believe your rights were not respected, you may also complain to Brazil's National Data Protection Authority (ANPD).",
      ],
    },
    {
      h: "9. Children and teenagers",
      p: [
        "The site and purchases are intended for people over 18. Data of minors may only be processed with a parent or guardian's specific consent (art. 14, LGPD). Selling alcoholic drinks to people under 18 is prohibited by law: the Bar only sells alcohol to people over 18 and we may ask for photo ID.",
      ],
    },
    {
      h: "10. Security",
      p: [
        "We adopt technical and organizational measures to protect your data — such as encrypted connections, hashed passwords, two-step verification for administrative staff, role-based access control and an audit trail. See details in our Security Policy. If a security incident that may cause relevant risk or harm occurs, we will notify you and the ANPD within the legal deadlines.",
      ],
    },
    {
      h: "11. Communications",
      p: [
        "We send emails needed for the service (account confirmation, ticket, changes, cancellations, security notices). Promotional messages only with your specific consent, with an option to opt out in every message.",
      ],
    },
    {
      h: "12. Changes to this policy",
      p: ["We may update this policy. The date and version are at the top, and relevant changes will be announced by email or on the site."],
    },
    {
      h: "13. Contact and data protection officer (DPO)",
      p: [
        "Data protection officer: [officer's name]. Privacy contact: [privacy email]. Security contact (vulnerabilities and incidents): [security email].",
      ],
    },
  ],
};

const ES: Politica = {
  titulo: "Política de Privacidad",
  aviso:
    "Versión 2.0 — 27/11/2026. Texto en revisión jurídica: los fragmentos entre [corchetes] serán completados por la organización antes de la publicación. En caso de duda, prevalece la versión en portugués.",
  intro: [
    "Esta política explica cómo LPZ Training ([razón social del responsable], [CNPJ o CPF], [dirección]) — el controlador de los datos — recopila, usa, comparte y protege los datos personales de quienes usan este sitio, compran entradas, usan el Bar y asisten a los eventos, según la Ley General de Protección de Datos de Brasil (Ley 13.709/2018 — LGPD).",
    "La escribimos de forma sencilla a propósito. Si algo no queda claro, escríbenos (ver “Contacto y encargado”).",
  ],
  secoes: [
    {
      h: "1. Qué datos recopilamos y por qué",
      li: [
        ["Registro: nombre, correo, celular, fecha de nacimiento, CPF (solo para quienes viven en Brasil), país/estado/ciudad", "crear y proteger tu cuenta, emitir y verificar entradas, comunicarnos sobre el evento (por ejemplo, cambios de horario), cobrar y cumplir obligaciones legales y fiscales. El CPF lo exige la pasarela de pago. La fecha de nacimiento confirma la edad (reglas de acceso y de venta de bebidas alcohólicas)."],
        ["Datos opcionales: dirección, ciudad y estado/país de nacimiento, “cómo nos conociste”, apodo y foto de perfil", "organización del evento, estadísticas y personalización. Puedes dejarlos en blanco, cambiarlos o borrarlos cuando quieras."],
        ["Compras (entradas, productos y servicios)", "registrar lo comprado, el valor, la forma de pago (Pix, crédito, débito), cuotas, estado del pago, cancelaciones y reembolsos, y emitir tus códigos QR."],
        ["Bar: pedidos hechos en el sitio, artículos, valores, tickets (QR), retiros en el mostrador y, si lo eliges, tu tarjeta guardada (solo marca, últimos 4 dígitos e identificador — ver sección 3)", "procesar el pedido, entregar lo comprado y comprobar lo entregado. Las cuentas (pulsera o tarjeta con número) no están vinculadas a ti: registran solo el número, los artículos y el pago."],
        ["Asistencia al evento (check-in y retiros)", "controlar la entrada y la entrega de productos y servicios, evitando el uso duplicado de entradas y tickets."],
        ["Inicio de sesión con Google (opcional)", "si eliges Google, recibimos solo tu nombre, correo y foto. No tenemos acceso a tu contraseña de Google ni a otros datos de tu cuenta."],
        ["Mensajes: Contáctanos y “Reportar problema”", "responderte y corregir errores. “Reportar problema” envía a la organización una captura de pantalla, la página, el navegador y registros de errores; la captura puede mostrar tus datos. Las contraseñas nunca se incluyen."],
        ["Datos técnicos: dirección IP, navegador, fecha y hora de accesos y acciones importantes", "seguridad de la cuenta, prevención de fraudes y registro de auditoría (quién hizo qué y cuándo)."],
      ],
      depois: [
        "No pedimos datos personales sensibles (como salud, religión o biometría). Tu contraseña se guarda cifrada (hash) y nadie de la organización puede verla. No vendemos tus datos y no tomamos decisiones basadas únicamente en tratamiento automatizado que te afecten.",
      ],
    },
    {
      h: "2. Para qué los usamos (finalidades) y la base legal",
      li: [
        ["Ejecución de contrato (art. 7, V)", "crear la cuenta, vender y entregar entradas, productos y servicios del Bar, procesar pagos, cancelaciones y reembolsos."],
        ["Obligación legal o regulatoria (art. 7, II)", "guardar registros fiscales y de venta, atender el derecho del consumidor y órdenes de autoridades."],
        ["Interés legítimo (art. 7, IX)", "seguridad del sitio, prevención de fraudes, registro de auditoría, límite de intentos de acceso y estadísticas simples del evento, siempre con el mínimo de datos y respetando tus derechos."],
        ["Ejercicio regular de derechos (art. 7, VI)", "guardar pruebas de compra, pago y entrega (por ejemplo, cuántas unidades de un pedido se retiraron) por si hay un reclamo."],
        ["Consentimiento (art. 7, I)", "datos opcionales, foto de perfil, tarjeta guardada y mensajes promocionales. Puedes retirarlo en cualquier momento, sin afectar lo ya tratado."],
      ],
    },
    {
      h: "3. Pagos y tarjetas",
      p: [
        "Los pagos los procesa Mercado Pago. Los datos de la tarjeta se escriben directamente en la página o en los campos seguros de Mercado Pago: LPZ Training no recibe, no ve ni guarda el número completo de la tarjeta, el vencimiento ni el código de seguridad (CVV). Mercado Pago actúa como controlador propio de los datos de pago, según su política.",
        "Tarjeta guardada (opcional): si lo autorizas, la tarjeta queda guardada en Mercado Pago y nosotros guardamos solo un identificador seguro, la marca, los últimos 4 dígitos y el vencimiento (MM/AA, para avisarte si venció), además de la fecha de tu consentimiento. En cada compra escribes solo el código de seguridad. Puedes quitar la tarjeta cuando quieras en Bar → Mis tarjetas, y también se elimina si se borra tu cuenta.",
        "Nunca pediremos tu contraseña, número de tarjeta o código por correo, WhatsApp o teléfono.",
      ],
    },
    {
      h: "4. Con quién los compartimos",
      li: [
        ["Mercado Pago", "pago, reembolso y tarjeta guardada."],
        ["Google", "solo si eliges entrar con Google."],
        ["Proveedor de envío de correos ([Brevo — confirmar])", "enviar confirmación de cuenta, entrada, avisos y respuestas."],
        ["Alojamiento y protección del sitio ([proveedor de VPS] y Cloudflare)", "mantener el sitio en línea, protegerlo de ataques y entregar páginas con rapidez. El tráfico pasa por estos proveedores."],
        ["Equipo y profesionales del evento", "solo quien lo necesita y solo lo necesario para su función: la portería verifica entradas, el mostrador y la caja del Bar ven pedidos y tickets, y la organización accede a los registros para dar soporte. El acceso es por perfil y queda registrado."],
        ["Autoridades y asesores", "cuando lo exija la ley o una orden judicial, y contadores y abogados bajo confidencialidad."],
      ],
      depois: [
        "Algunos de estos proveedores pueden tratar datos fuera de Brasil (por ejemplo, Google, Cloudflare y el proveedor de correo). En esos casos adoptamos las garantías del art. 33 de la LGPD, como cláusulas contractuales y proveedores con estándares reconocidos de seguridad.",
      ],
    },
    {
      h: "5. Cookies y almacenamiento en tu dispositivo",
      p: ["Usamos solo lo necesario para que el sitio funcione. No usamos cookies de publicidad ni de rastreo para marketing."],
      li: [
        ["Cookie de sesión (inicio de sesión)", "te mantiene conectado y protege la cuenta. Esencial."],
        ["lpz_idioma", "recuerda el idioma elegido (hasta 1 año). Preferencia."],
        ["Bolsa del Bar (almacenamiento local)", "guarda en tu dispositivo los artículos de la bolsa hasta que pagues o la vacíes."],
        ["Control de compra automática (almacenamiento de la pestaña)", "evita repetir una compra al volver de una página."],
        ["Mercado Pago y Google", "al abrir su página de pago o de acceso, pueden usar cookies propias, según sus políticas."],
      ],
      depois: ["Puedes borrar las cookies y datos del sitio en tu navegador; sin la cookie de sesión tendrás que volver a entrar."],
    },
    {
      h: "6. Fotos y videos del evento",
      p: [
        "Los eventos tienen fotógrafos y filmación (incluidos los servicios “Paparazzi”). Las imágenes del público pueden aparecer en la Galería y en la difusión. Si no quieres aparecer, avisa al equipo en el evento o escribe al contacto de privacidad y eliminaremos la imagen en un plazo razonable. [Revisar con la organización: reglas de uso de imagen.]",
      ],
    },
    {
      h: "7. Por cuánto tiempo los guardamos",
      li: [
        ["Cuenta y registro", "mientras la cuenta esté activa. Al eliminarla, borramos el registro, la foto y las tarjetas guardadas."],
        ["Compras, pagos, reembolsos y entregas", "por 5 años, para obligaciones fiscales, defensa del consumidor y prueba de derechos [confirmar con el contador]. Quedan sin vínculo con el acceso tras eliminar la cuenta."],
        ["Registros técnicos de acceso y seguridad", "por el mínimo exigido por ley (6 meses) y el tiempo necesario para la seguridad [definir: sugerido hasta 12 meses]."],
        ["Registro de auditoría (quién cambió qué)", "por el tiempo necesario para la seguridad y la prueba de derechos [definir: sugerido 5 años]. Nombres y correos se copian para no perder el historial; CPF, celular, nacimiento y dirección se enmascaran."],
        ["Capturas de “Reportar problema”", "quedan solo en los correos de soporte y se borran tras la solución [definir: hasta 90 días]."],
      ],
      depois: ["Pasado el plazo, eliminamos o anonimizamos los datos, salvo que la ley exija guardarlos por más tiempo."],
    },
    {
      h: "8. Tus derechos",
      p: [
        "En cualquier momento y sin costo (art. 18, LGPD) puedes pedir: confirmación de que tratamos tus datos; acceso; corrección de datos incompletos o desactualizados; anonimización, bloqueo o eliminación de datos innecesarios o tratados en desacuerdo con la ley; portabilidad; información sobre con quién los compartimos; información sobre la posibilidad de no consentir y sus consecuencias; retiro del consentimiento; y oposición al tratamiento hecho sin consentimiento cuando se incumpla la ley.",
        "Dónde hacerlo: tú mismo cambias tus datos en Mi registro, la foto en Mi foto y las tarjetas en Bar → Mis tarjetas. Para otras solicitudes (acceso, eliminación de la cuenta, portabilidad), escribe al contacto de abajo. Confirmaremos tu identidad y responderemos en hasta 15 días.",
        "Si crees que no se respetaron tus derechos, también puedes reclamar ante la Autoridad Nacional de Protección de Datos de Brasil (ANPD).",
      ],
    },
    {
      h: "9. Niños y adolescentes",
      p: [
        "El sitio y las compras están destinados a mayores de 18 años. Los datos de menores solo pueden tratarse con el consentimiento específico de un responsable (art. 14, LGPD). La venta de bebidas alcohólicas a menores de 18 años está prohibida por ley: el Bar solo vende alcohol a mayores de 18 y podemos pedir documento con foto.",
      ],
    },
    {
      h: "10. Seguridad",
      p: [
        "Adoptamos medidas técnicas y organizativas para proteger tus datos — como conexión cifrada, contraseñas en hash, verificación en dos pasos para el equipo administrativo, control de acceso por perfil y registro de auditoría. Mira los detalles en nuestra Política de Seguridad. Si ocurre un incidente de seguridad que pueda causar riesgo o daño relevante, te avisaremos a ti y a la ANPD en los plazos legales.",
      ],
    },
    {
      h: "11. Comunicaciones",
      p: [
        "Enviamos correos necesarios para el servicio (confirmación de cuenta, entrada, cambios, cancelaciones, avisos de seguridad). Mensajes promocionales solo con tu consentimiento específico, con opción de cancelar en cada mensaje.",
      ],
    },
    {
      h: "12. Cambios en esta política",
      p: ["Podemos actualizar esta política. La fecha y la versión están arriba, y los cambios relevantes se avisarán por correo o en el sitio."],
    },
    {
      h: "13. Contacto y encargado (DPO)",
      p: [
        "Encargado del tratamiento de datos: [nombre del encargado]. Contacto de privacidad: [correo de privacidad]. Contacto de seguridad (vulnerabilidades e incidentes): [correo de seguridad].",
      ],
    },
  ],
};

export const POLITICA = { pt: PT, en: EN, es: ES } as const;
