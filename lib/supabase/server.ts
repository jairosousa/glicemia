import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para uso no servidor (Server Components, Server Actions).
 *
 * `cookies()` é assíncrono a partir do Next.js 16 — por isso esta função
 * também é assíncrona. É aqui que a sessão de login é lida a cada requisição.
 */
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesParaDefinir) {
          try {
            for (const { name, value, options } of cookiesParaDefinir) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Chamado de dentro de um Server Component, que não pode escrever
            // cookies. Sem problema: o proxy.ts (equivalente ao antigo
            // middleware.ts) já cuida de renovar a sessão a cada requisição.
          }
        },
      },
    },
  );
}
