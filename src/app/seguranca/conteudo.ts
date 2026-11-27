import type { Politica } from "../privacidade/conteudo";

// Política de Segurança (resumo público). Descreve só o que o sistema realmente
// faz; trechos entre [colchetes] a organização precisa confirmar ou preencher.

const PT: Politica = {
  titulo: "Política de Segurança",
  aviso: "Versão 1.0 — 27/11/2026. Texto em revisão: os trechos entre [colchetes] serão confirmados pela organização antes da publicação.",
  intro: [
    "O LPZ Training cuida da segurança dos dados de quem compra e participa dos nossos eventos. Esta página resume, sem expor detalhes que ajudariam um ataque, o que fazemos, o que esperamos de você e como falar com a gente em caso de problema. Ela complementa a Política de Privacidade.",
  ],
  secoes: [
    {
      h: "1. O que fazemos para proteger seus dados",
      li: [
        ["Conexão criptografada", "o site é acessado por HTTPS, com proteção e filtragem de tráfego (Cloudflare) na frente do servidor."],
        ["Senhas", "são guardadas em forma de hash (não é possível ler a senha original). Há limite de tentativas de login e de recuperação de senha para dificultar adivinhação."],
        ["Verificação em duas etapas", "obrigatória (aplicativo autenticador) para a equipe administrativa. Entrar em um aparelho encerra a sessão aberta em outro."],
        ["Acesso por perfil (menor privilégio)", "cada pessoa da equipe só acessa o que precisa (portaria, mídias, organização, caixa, balcão e gestão do Bar). A checagem é feita no servidor, não só nos menus. O perfil do caixa do Bar, por exemplo, não vê custos nem lucro."],
        ["Trilha de auditoria", "ações sensíveis (mudança de perfis e cadastros, estornos, ajustes de estoque, retiradas de produtos) ficam registradas com quem fez, quando e de onde. Os registros só recebem inclusão; dados como CPF e celular aparecem mascarados."],
        ["Proteção das entradas", "tudo que é digitado ou enviado é validado; as consultas ao banco são parametrizadas; formulários conferem a origem da requisição; e arquivos enviados (fotos) são conferidos pelo conteúdo e limitados em tamanho."],
        ["Ingressos e tickets do Bar", "o QR code só aponta para o ticket: a validade e o saldo são sempre conferidos no banco de dados, um ingresso ou ticket não vale duas vezes e a página de conferência só abre para a equipe."],
        ["Cópias de segurança", "fazemos cópia do banco de dados antes de cada atualização do sistema [e cópias automáticas periódicas — definir frequência e prazo]."],
      ],
    },
    {
      h: "2. Pagamentos e cartões",
      li: [
        ["Dados de cartão", "não passam pelo nosso servidor: são digitados na página ou nos campos seguros do Mercado Pago, que segue os padrões de segurança do setor de cartões (PCI DSS). Não guardamos número, validade completa nem código de segurança."],
        ["Cartão salvo", "fica no Mercado Pago; guardamos só um identificador, a bandeira e os 4 últimos dígitos. Cada compra exige o código de segurança, e você remove o cartão quando quiser."],
        ["Confirmação de pagamento", "o status é sempre consultado diretamente no Mercado Pago (não confiamos só no endereço de retorno), e os avisos automáticos do Mercado Pago têm a assinatura conferida."],
        ["Estornos", "só a organização autorizada devolve valores, e cada estorno fica registrado."],
      ],
    },
    {
      h: "3. O que esperamos de você",
      li: [
        ["Senha forte e exclusiva", "use uma senha longa que você não usa em outros sites e não a compartilhe."],
        ["Desconfie de mensagens falsas", "o LPZ Training nunca pede senha, número de cartão ou código por e-mail, WhatsApp ou telefone. Confira sempre o endereço do site."],
        ["Computadores compartilhados", "saia da sua conta (Sair) ao terminar."],
        ["Equipe", "não compartilhe o login nem o código da verificação em duas etapas e avise a organização se perder o celular."],
      ],
    },
    {
      h: "4. Incidentes de segurança",
      p: [
        "Temos um procedimento para identificar, conter, investigar e corrigir incidentes. Se um incidente puder causar risco ou dano relevante aos titulares, comunicaremos os afetados e a Autoridade Nacional de Proteção de Dados (ANPD) nos prazos legais, informando o que aconteceu, quais dados foram envolvidos e o que fazer para se proteger.",
      ],
    },
    {
      h: "5. Fornecedores",
      p: [
        "Trabalhamos com fornecedores reconhecidos para pagamento (Mercado Pago), login opcional (Google), e-mails ([provedor — confirmar]), hospedagem ([provedor de VPS]) e proteção de tráfego (Cloudflare), e só compartilhamos o necessário para cada função. Eles seguem as próprias políticas de segurança e de privacidade.",
      ],
    },
    {
      h: "6. Encontrou uma falha?",
      p: [
        "Se você encontrar uma vulnerabilidade ou suspeitar de uso indevido da sua conta, escreva para [e-mail de segurança] com o máximo de detalhes. Pedimos que você não acesse dados de outras pessoas, não derrube o serviço e nos dê um prazo razoável para corrigir antes de divulgar. Agradecemos o aviso feito de boa-fé.",
      ],
    },
    {
      h: "7. Limites",
      p: ["Nenhum sistema é 100% seguro. Trabalhamos para reduzir riscos e revisamos estas medidas periodicamente. Esta política pode mudar: a data e a versão ficam no topo."],
    },
  ],
};

const EN: Politica = {
  titulo: "Security Policy",
  aviso: "Version 1.0 — 11/27/2026. Text under review: items in [brackets] will be confirmed by the organization before publication. In case of doubt, the Portuguese version prevails.",
  intro: [
    "LPZ Training looks after the security of the data of people who buy and take part in our events. This page summarizes, without exposing details that would help an attack, what we do, what we expect from you and how to reach us if there is a problem. It complements the Privacy Policy.",
  ],
  secoes: [
    {
      h: "1. What we do to protect your data",
      li: [
        ["Encrypted connection", "the site is accessed over HTTPS, with traffic protection and filtering (Cloudflare) in front of the server."],
        ["Passwords", "are stored as hashes (the original password cannot be read). There are limits on login and password-recovery attempts to make guessing harder."],
        ["Two-step verification", "mandatory (authenticator app) for administrative staff. Signing in on one device ends the session open on another."],
        ["Role-based access (least privilege)", "each staff member only accesses what they need (door, media, organization, cashier, counter and Bar management). The check is done on the server, not just in menus. The Bar cashier role, for example, does not see costs or profit."],
        ["Audit trail", "sensitive actions (changes to roles and records, refunds, stock adjustments, product pickups) are logged with who did it, when and from where. The logs are append-only; data such as CPF and phone appear masked."],
        ["Input protection", "everything typed or uploaded is validated; database queries are parameterized; forms check the origin of the request; and uploaded files (photos) are checked by content and limited in size."],
        ["Tickets and Bar tickets", "the QR code only points to the ticket: validity and balance are always checked in the database, a ticket cannot be used twice and the check page only opens for staff."],
        ["Backups", "we back up the database before every system update [and periodic automatic backups — define frequency and retention]."],
      ],
    },
    {
      h: "2. Payments and cards",
      li: [
        ["Card data", "does not pass through our server: it is typed on Mercado Pago's page or secure fields, which follows the card industry's security standards (PCI DSS). We do not store the number, full expiry or security code."],
        ["Saved card", "stays at Mercado Pago; we keep only an identifier, the brand and the last 4 digits. Each purchase requires the security code, and you can remove the card any time."],
        ["Payment confirmation", "the status is always queried directly at Mercado Pago (we do not rely only on the return address), and Mercado Pago's automatic notices have their signature checked."],
        ["Refunds", "only authorized organization staff return money, and each refund is logged."],
      ],
    },
    {
      h: "3. What we expect from you",
      li: [
        ["Strong, unique password", "use a long password you do not use on other sites and do not share it."],
        ["Beware of fake messages", "LPZ Training never asks for your password, card number or code by email, WhatsApp or phone. Always check the site address."],
        ["Shared computers", "sign out of your account (Sign out) when you finish."],
        ["Staff", "do not share your login or two-step code and tell the organization if you lose your phone."],
      ],
    },
    {
      h: "4. Security incidents",
      p: [
        "We have a procedure to identify, contain, investigate and fix incidents. If an incident may cause relevant risk or harm to data subjects, we will notify those affected and Brazil's National Data Protection Authority (ANPD) within the legal deadlines, saying what happened, which data was involved and what to do to protect yourself.",
      ],
    },
    {
      h: "5. Suppliers",
      p: [
        "We work with recognized suppliers for payment (Mercado Pago), optional login (Google), email ([provider — confirm]), hosting ([VPS provider]) and traffic protection (Cloudflare), and share only what each role needs. They follow their own security and privacy policies.",
      ],
    },
    {
      h: "6. Found a flaw?",
      p: [
        "If you find a vulnerability or suspect misuse of your account, write to [security email] with as much detail as possible. We ask that you do not access other people's data, do not take the service down and give us reasonable time to fix before disclosing. We thank you for good-faith reports.",
      ],
    },
    {
      h: "7. Limits",
      p: ["No system is 100% secure. We work to reduce risks and review these measures periodically. This policy may change: the date and version are at the top."],
    },
  ],
};

const ES: Politica = {
  titulo: "Política de Seguridad",
  aviso: "Versión 1.0 — 27/11/2026. Texto en revisión: los fragmentos entre [corchetes] serán confirmados por la organización antes de la publicación. En caso de duda, prevalece la versión en portugués.",
  intro: [
    "LPZ Training cuida la seguridad de los datos de quienes compran y participan en nuestros eventos. Esta página resume, sin exponer detalles que ayudarían a un ataque, lo que hacemos, lo que esperamos de ti y cómo contactarnos si hay un problema. Complementa la Política de Privacidad.",
  ],
  secoes: [
    {
      h: "1. Qué hacemos para proteger tus datos",
      li: [
        ["Conexión cifrada", "se accede al sitio por HTTPS, con protección y filtrado de tráfico (Cloudflare) delante del servidor."],
        ["Contraseñas", "se guardan como hash (no se puede leer la contraseña original). Hay límite de intentos de acceso y de recuperación de contraseña para dificultar que las adivinen."],
        ["Verificación en dos pasos", "obligatoria (aplicación autenticadora) para el equipo administrativo. Entrar en un dispositivo cierra la sesión abierta en otro."],
        ["Acceso por perfil (mínimo privilegio)", "cada persona del equipo solo accede a lo que necesita (portería, medios, organización, caja, mostrador y gestión del Bar). La comprobación se hace en el servidor, no solo en los menús. El perfil de caja del Bar, por ejemplo, no ve costos ni ganancias."],
        ["Registro de auditoría", "las acciones sensibles (cambios de perfiles y registros, reembolsos, ajustes de stock, retiros de productos) quedan registradas con quién las hizo, cuándo y desde dónde. Los registros solo admiten altas; datos como CPF y celular aparecen enmascarados."],
        ["Protección de las entradas", "todo lo que se escribe o se envía se valida; las consultas a la base de datos son parametrizadas; los formularios comprueban el origen de la solicitud; y los archivos enviados (fotos) se verifican por su contenido y se limitan en tamaño."],
        ["Entradas y tickets del Bar", "el código QR solo apunta al ticket: la validez y el saldo se comprueban siempre en la base de datos, una entrada o ticket no vale dos veces y la página de verificación solo se abre para el equipo."],
        ["Copias de seguridad", "hacemos una copia de la base de datos antes de cada actualización del sistema [y copias automáticas periódicas — definir frecuencia y plazo]."],
      ],
    },
    {
      h: "2. Pagos y tarjetas",
      li: [
        ["Datos de tarjeta", "no pasan por nuestro servidor: se escriben en la página o en los campos seguros de Mercado Pago, que sigue los estándares de seguridad del sector de tarjetas (PCI DSS). No guardamos el número, el vencimiento completo ni el código de seguridad."],
        ["Tarjeta guardada", "queda en Mercado Pago; guardamos solo un identificador, la marca y los últimos 4 dígitos. Cada compra exige el código de seguridad, y puedes quitar la tarjeta cuando quieras."],
        ["Confirmación de pago", "el estado se consulta siempre directamente en Mercado Pago (no confiamos solo en la dirección de retorno), y los avisos automáticos de Mercado Pago tienen su firma verificada."],
        ["Reembolsos", "solo el personal autorizado de la organización devuelve valores, y cada reembolso queda registrado."],
      ],
    },
    {
      h: "3. Lo que esperamos de ti",
      li: [
        ["Contraseña fuerte y única", "usa una contraseña larga que no uses en otros sitios y no la compartas."],
        ["Desconfía de mensajes falsos", "LPZ Training nunca pide contraseña, número de tarjeta ni código por correo, WhatsApp o teléfono. Revisa siempre la dirección del sitio."],
        ["Computadoras compartidas", "cierra tu sesión (Salir) al terminar."],
        ["Equipo", "no compartas tu acceso ni el código de la verificación en dos pasos y avisa a la organización si pierdes el celular."],
      ],
    },
    {
      h: "4. Incidentes de seguridad",
      p: [
        "Tenemos un procedimiento para identificar, contener, investigar y corregir incidentes. Si un incidente puede causar riesgo o daño relevante a los titulares, avisaremos a los afectados y a la Autoridad Nacional de Protección de Datos de Brasil (ANPD) en los plazos legales, informando qué ocurrió, qué datos estuvieron involucrados y qué hacer para protegerte.",
      ],
    },
    {
      h: "5. Proveedores",
      p: [
        "Trabajamos con proveedores reconocidos para pago (Mercado Pago), acceso opcional (Google), correos ([proveedor — confirmar]), alojamiento ([proveedor de VPS]) y protección de tráfico (Cloudflare), y compartimos solo lo necesario para cada función. Ellos siguen sus propias políticas de seguridad y privacidad.",
      ],
    },
    {
      h: "6. ¿Encontraste una falla?",
      p: [
        "Si encuentras una vulnerabilidad o sospechas un uso indebido de tu cuenta, escribe a [correo de seguridad] con el mayor detalle posible. Te pedimos que no accedas a datos de otras personas, no derribes el servicio y nos des un plazo razonable para corregir antes de divulgar. Agradecemos el aviso hecho de buena fe.",
      ],
    },
    {
      h: "7. Límites",
      p: ["Ningún sistema es 100 % seguro. Trabajamos para reducir riesgos y revisamos estas medidas periódicamente. Esta política puede cambiar: la fecha y la versión están arriba."],
    },
  ],
};

export const SEGURANCA = { pt: PT, en: EN, es: ES } as const;
