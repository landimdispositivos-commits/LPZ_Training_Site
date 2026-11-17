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
