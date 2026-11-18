import type { Metadata } from "next";
import { Michroma, Mrs_Saint_Delafield, Poppins } from "next/font/google";
import "./globals.css";
import { LOCALE, tx } from "@/i18n";
import { ProvedorIdioma } from "@/i18n/cliente";
import { obterIdioma } from "@/i18n/servidor";

// Fontes Google (licença OFL), servidas pelo próprio site via next/font.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

const michroma = Michroma({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-michroma",
});

const scriptAccent = Mrs_Saint_Delafield({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script-accent",
});

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await obterIdioma();
  return {
    title: "LPZ Training",
    description: tx(
      idioma,
      "LPZ Training — congresso e treinamento de zouk. Cronograma, professores, ingressos e fotos do evento.",
      "LPZ Training — zouk congress and training. Schedule, teachers, tickets and event photos.",
      "LPZ Training — congreso y entrenamiento de zouk. Cronograma, profesores, entradas y fotos del evento.",
    ),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const idioma = await obterIdioma();
  return (
    <html
      lang={LOCALE[idioma]}
      className={`${poppins.variable} ${michroma.variable} ${scriptAccent.variable}`}
    >
      <body className="min-h-screen antialiased">
        <ProvedorIdioma idioma={idioma}>{children}</ProvedorIdioma>
      </body>
    </html>
  );
}
