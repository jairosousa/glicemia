import type { criarClienteServidor } from "@/lib/supabase/server";

export type Papel = "PACIENTE" | "OBSERVADOR";

type ClienteServidor = Awaited<ReturnType<typeof criarClienteServidor>>;

/**
 * Lê o papel do usuário logado neste perfil (PROJECT.md F8).
 *
 * `null` quando não há vínculo nenhum — situação que, na prática, nunca deve
 * aparecer nas páginas de perfil, porque a RLS já impede o próprio `select`
 * do perfil de voltar algo para quem não tem acesso (ver perfil_select em
 * supabase/migrations/0001_schema_inicial.sql).
 */
export async function obterPapelAcesso(
  supabase: ClienteServidor,
  perfilId: string,
  usuarioId: string,
): Promise<Papel | null> {
  const { data } = await supabase
    .from("perfil_acesso")
    .select("papel")
    .eq("perfil_id", perfilId)
    .eq("usuario_id", usuarioId)
    .maybeSingle<{ papel: Papel }>();

  return data?.papel ?? null;
}
