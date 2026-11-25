// Versão em inglês das mensagens da ficha do congressista. As regras (e as
// mensagens originais em português) ficam em cadastro.ts; aqui só traduzimos
// o que aparece na tela quando o visitante escolhe inglês.

const MENSAGENS_EN: Record<string, string> = {
  "Informe seu nome completo.": "Enter your full name.",
  "Nome longo demais.": "Name is too long.",
  "Informe a data de nascimento.": "Enter your date of birth.",
  "Informe o celular.": "Enter your mobile number.",
  "Informe o país.": "Enter the country.",
  "Informe a cidade.": "Enter the city.",
  "Nome de cidade longo demais.": "City name is too long.",
  "Escolha uma das opções da lista.": "Choose one of the options in the list.",
  "Data de nascimento inválida.": "Invalid date of birth.",
  "Confira a data de nascimento.": "Please check the date of birth.",
  "Celular inválido. Use DDD + número, ex: (11) 91234-5678.": "Invalid mobile number. Use area code + number, e.g. (11) 91234-5678.",
  "Celular inválido. Inclua o código do país, ex: +351 912 345 678.":
    "Invalid mobile number. Include the country code, e.g. +351 912 345 678.",
  "Selecione o estado.": "Select the state.",
  "CPF inválido.": "Invalid CPF.",
  "Informe a rua/avenida ou deixe o endereço todo em branco.": "Enter the street or leave the whole address blank.",
  'Informe o número (ou "s/n").': 'Enter the number (or "n/a").',
  "CEP inválido. Use 8 dígitos, ex: 01310-100.": "Invalid CEP. Use 8 digits, e.g. 01310-100.",
  "Conte como nos conheceu.": "Tell us how you heard about us.",
  "É preciso aceitar a Política de Privacidade.": "You need to accept the Privacy Policy.",
  "Não foi possível usar este CPF. Se você já tem outra conta com ele, entre por ela ou fale com a organização.":
    "This CPF cannot be used. If you already have another account with it, sign in with that account or contact the organizers.",
  "Não foi possível salvar seus dados agora. Tente de novo em instantes.":
    "We could not save your details right now. Please try again in a moment.",
};

export function mensagemFichaEn(mensagem: string) {
  const limite = /^Use no máximo (\d+) caracteres\.$/.exec(mensagem);
  if (limite) return `Use at most ${limite[1]} characters.`;
  return MENSAGENS_EN[mensagem] ?? mensagem;
}

// Rótulos das opções de "Como conheceu" (o valor gravado continua em português).
export const COMO_CONHECEU_EN: Record<string, string> = {
  Instagram: "Instagram",
  Facebook: "Facebook",
  WhatsApp: "WhatsApp",
  "Indicação de amigo(a)": "A friend's recommendation",
  "Professor(a) ou escola de dança": "Teacher or dance school",
  "Google / pesquisa na internet": "Google / web search",
  "Outro evento de dança": "Another dance event",
  Outro: "Other",
};

// ---- Espanhol ---------------------------------------------------------------

const MENSAGENS_ES: Record<string, string> = {
  "Informe seu nome completo.": "Ingresa tu nombre completo.",
  "Nome longo demais.": "El nombre es demasiado largo.",
  "Informe a data de nascimento.": "Ingresa tu fecha de nacimiento.",
  "Informe o celular.": "Ingresa tu celular.",
  "Informe o país.": "Ingresa el país.",
  "Informe a cidade.": "Ingresa la ciudad.",
  "Nome de cidade longo demais.": "El nombre de la ciudad es demasiado largo.",
  "Escolha uma das opções da lista.": "Elige una de las opciones de la lista.",
  "Data de nascimento inválida.": "Fecha de nacimiento inválida.",
  "Confira a data de nascimento.": "Revisa la fecha de nacimiento.",
  "Celular inválido. Use DDD + número, ex: (11) 91234-5678.": "Celular inválido. Usa código de área + número, ej.: (11) 91234-5678.",
  "Celular inválido. Inclua o código do país, ex: +351 912 345 678.":
    "Celular inválido. Incluye el código del país, ej.: +34 612 345 678.",
  "Selecione o estado.": "Selecciona el estado.",
  "CPF inválido.": "CPF inválido.",
  "Informe a rua/avenida ou deixe o endereço todo em branco.": "Ingresa la calle o deja toda la dirección en blanco.",
  'Informe o número (ou "s/n").': 'Ingresa el número (o "s/n").',
  "CEP inválido. Use 8 dígitos, ex: 01310-100.": "CEP inválido. Usa 8 dígitos, ej.: 01310-100.",
  "Conte como nos conheceu.": "Cuéntanos cómo nos conociste.",
  "É preciso aceitar a Política de Privacidade.": "Debes aceptar la Política de Privacidad.",
  "Não foi possível usar este CPF. Se você já tem outra conta com ele, entre por ela ou fale com a organização.":
    "No es posible usar este CPF. Si ya tienes otra cuenta con él, entra con esa cuenta o contacta a la organización.",
  "Não foi possível salvar seus dados agora. Tente de novo em instantes.":
    "No pudimos guardar tus datos ahora. Inténtalo de nuevo en unos momentos.",
};

// Mensagem da ficha no idioma do visitante (as regras geram em português).
export function mensagemFicha(mensagem: string, idioma: "pt" | "en" | "es") {
  if (idioma === "en") return mensagemFichaEn(mensagem);
  if (idioma === "es") {
    const limite = /^Use no máximo (\d+) caracteres\.$/.exec(mensagem);
    if (limite) return `Usa como máximo ${limite[1]} caracteres.`;
    return MENSAGENS_ES[mensagem] ?? mensagem;
  }
  return mensagem;
}

export const COMO_CONHECEU_ES: Record<string, string> = {
  Instagram: "Instagram",
  Facebook: "Facebook",
  WhatsApp: "WhatsApp",
  "Indicação de amigo(a)": "Recomendación de un(a) amigo(a)",
  "Professor(a) ou escola de dança": "Profesor(a) o escuela de baile",
  "Google / pesquisa na internet": "Google / búsqueda en internet",
  "Outro evento de dança": "Otro evento de baile",
  Outro: "Otro",
};
