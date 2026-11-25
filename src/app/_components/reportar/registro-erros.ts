// Guarda (só na memória da aba) os últimos erros do navegador, para irem
// junto no "Reportar problema". Nada é enviado sem a pessoa clicar.

export type ErroRegistrado = { quando: string; tipo: string; mensagem: string };

const MAXIMO = 30;
const erros: ErroRegistrado[] = [];
let instalado = false;

function guardar(tipo: string, mensagem: string) {
  erros.push({ quando: new Date().toISOString(), tipo, mensagem: mensagem.slice(0, 1000) });
  if (erros.length > MAXIMO) erros.shift();
}

export function instalarRegistroDeErros() {
  if (instalado || typeof window === "undefined") return;
  instalado = true;
  window.addEventListener("error", (e) => {
    guardar("erro", `${e.message}${e.filename ? ` (${e.filename}:${e.lineno}:${e.colno})` : ""}`);
  });
  window.addEventListener("unhandledrejection", (e) => {
    const motivo = e.reason instanceof Error ? `${e.reason.message}\n${e.reason.stack ?? ""}` : String(e.reason);
    guardar("promessa", motivo);
  });
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    guardar("console", args.map((a) => (a instanceof Error ? `${a.message}\n${a.stack ?? ""}` : String(a))).join(" "));
    original(...args);
  };
}

export function errosRegistrados() {
  return [...erros];
}
