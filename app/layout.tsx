import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { IndicadorFila } from "@/components/IndicadorFila";
import { RegistrarServiceWorker } from "@/components/RegistrarServiceWorker";
import { SincronizadorFila } from "@/components/SincronizadorFila";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Glicemia",
  description:
    "Acompanhamento de glicemia, insulina, refeições e humor. Ferramenta de registro pessoal — não substitui avaliação médica.",
  applicationName: "Glicemia",
  // PROJECT.md F10: instalável na tela de início. No iOS, o app só recebe
  // notificação/comportamento de app instalado a partir daqui — ver a
  // ressalva de §8.6 sobre push no iOS (fase 3).
  appleWebApp: {
    capable: true,
    title: "Glicemia",
    statusBarStyle: "default",
  },
};

/**
 * `maximumScale` e `userScalable` ficam nos valores permissivos de propósito:
 * bloquear o zoom é uma falha de acessibilidade, e parte dos usuários deste app
 * precisa ampliar a tela para ler.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RegistrarServiceWorker />
        <SincronizadorFila />
        <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
          <IndicadorFila />
        </div>
        {children}
      </body>
    </html>
  );
}
