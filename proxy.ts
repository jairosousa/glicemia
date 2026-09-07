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
     * Roda em toda rota, exceto arquivos estáticos e de imagem — eles não
     * precisam de sessão e rodar o proxy neles só adicionaria latência.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
