// Mensagens para quando o login com Google volta com ?error=<código>.
// Códigos vêm do Better Auth (callback OAuth) ou do próprio Google.
export function mensagemErroGoogle(codigo: string | undefined, area: "congressistas" | "profissionais") {
  if (!codigo) return undefined;
  switch (codigo) {
    case "access_denied":
      return "Login com Google cancelado.";
    case "signup_disabled":
      return area === "profissionais"
        ? "Não encontramos uma conta de profissional com esse e-mail do Google. Use o mesmo e-mail do convite ou entre com e-mail e senha."
        : "Não foi possível criar a conta com o Google. Tente de novo.";
    case "account_not_linked":
      return "Já existe uma conta com esse e-mail, mas ele ainda não foi confirmado. Entre com e-mail e senha (confirmando o e-mail) e depois você poderá usar o Google.";
    case "unable_to_link_account":
    case "unable_to_create_session":
      // Inclui o bloqueio de administradores (ver hooks em auth.ts).
      return "Não foi possível entrar com o Google nesta conta. Contas de administrador entram só por e-mail, senha e verificação em duas etapas.";
    default:
      return "Não foi possível entrar com o Google. Tente de novo ou use e-mail e senha.";
  }
}
