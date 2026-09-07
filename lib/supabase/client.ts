import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso no navegador (componentes "use client").
 *
 * As duas variáveis vêm de `.env.local` e começam com NEXT_PUBLIC_ de propósito:
 * é assim que o Next.js sabe que podem ser enviadas ao navegador. Isso é seguro
 * porque quem protege os dados são as regras de permissão do banco (RLS),
 * criadas na etapa 3 — não o sigilo desta chave.
 */
export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
