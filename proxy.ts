import { type NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/proxy";

/**
 * Roda antes de toda página. Ver lib/supabase/proxy.ts para o que ele faz.
 *
 * Nome do arquivo, do runtime e da função export são exigência do Next.js 16
 * — a peça que antes se chamava middleware.ts.
 */
export async function proxy(request: NextRequest) {
  return atualizarSessao(request);
}

export const config = {
  matcher: [
    /*
     * Roda em toda rota, exceto arquivos estáticos, de imagem e os arquivos
     * do PWA (manifesto, service worker, ícone do iOS — PROJECT.md F10):
     * eles precisam responder sem sessão, senão o navegador não instala o
     * service worker nem lê o manifesto antes do primeiro login.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
