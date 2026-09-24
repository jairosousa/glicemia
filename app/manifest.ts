import type { MetadataRoute } from "next";

/**
 * Manifesto do PWA (PROJECT.md F10) — permite instalar o app na tela de
 * início do celular e no desktop. Cores espelham os tokens claros de
 * app/globals.css (--fundo/--texto); o navegador escolhe o ícone/tema por
 * conta própria em modo escuro.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Glicemia",
    short_name: "Glicemia",
    description:
      "Acompanhamento de glicemia, insulina, refeições e humor. Uso pessoal e familiar.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
