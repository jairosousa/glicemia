import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

/**
 * Ponto de chegada do login com Google.
 *
 * O Google devolve o usuário para cá com um código de uma vez (`code`) na URL.
 * Trocamos esse código por uma sessão de verdade e mandamos para a home.
 * É esta URL — `/auth/callback` — que precisa estar cadastrada como URI de
 * redirecionamento no Google Cloud Console e ecoada na configuração do
 * provider Google dentro do Supabase.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const proximaPagina = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${proximaPagina}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=auth`);
}
