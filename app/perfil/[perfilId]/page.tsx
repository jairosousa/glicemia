import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obterPapelAcesso } from "@/lib/acesso";
import { METAS_PADRAO } from "@/lib/glicemia";
import { calcularIdade, linhaParaMetas, type Perfil, type PerfilMetaLinha } from "@/lib/perfil";
import { criarClienteServidor } from "@/lib/supabase/server";

/**
 * Tela do perfil ativo — ponto de partida para registrar, ver o histórico e
 * o painel de análise deste perfil.
 */
export default async function PerfilPage({
  params,
}: {
  params: Promise<{ perfilId: string }>;
}) {
  const { perfilId } = await params;
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: perfil }, { data: metas }] = await Promise.all([
    supabase.from("perfil").select("*").eq("id", perfilId).single<Perfil>(),
    supabase.from("perfil_meta").select("*").eq("perfil_id", perfilId).single<PerfilMetaLinha>(),
  ]);

  // RLS filtra silenciosamente: se o usuário não tem acesso a este perfil (ou
  // o id não existe), a consulta volta vazia — não um erro. Tratamos como
  // "página não encontrada", sem vazar se o perfil existe para outra pessoa.
  if (!perfil) {
    notFound();
  }

  const papel = await obterPapelAcesso(supabase, perfilId, user.id);
  const podeEditar = papel === "PACIENTE";

  const metasEfetivas = metas ? linhaParaMetas(metas) : METAS_PADRAO;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col gap-1.5">
        <Link href="/" className="text-sm text-texto-suave hover:underline">
          ← Trocar de perfil
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold">{perfil.nome}</h1>
          {!podeEditar && <span className="faixa faixa-alvo">Modo leitura</span>}
        </div>
        <p className="text-texto-suave">{calcularIdade(perfil.data_nascimento)} anos</p>
      </div>

      {podeEditar && (
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/perfil/${perfil.id}/glicemia/nova`}
            className="toque flex items-center justify-center rounded-xl bg-texto px-4 text-center text-base font-semibold text-fundo sm:text-lg"
          >
            + Glicemia
          </Link>
          <Link
            href={`/perfil/${perfil.id}/insulina/nova`}
            className="toque flex items-center justify-center rounded-xl border-2 border-texto px-4 text-center text-base font-semibold text-texto sm:text-lg"
          >
            + Insulina
          </Link>
          <Link
            href={`/perfil/${perfil.id}/refeicao/nova`}
            className="toque flex items-center justify-center rounded-xl border border-borda px-4 text-center text-base font-medium text-texto transition hover:bg-superficie"
          >
            + Refeição
          </Link>
          <Link
            href={`/perfil/${perfil.id}/humor/nova`}
            className="toque flex items-center justify-center rounded-xl border border-borda px-4 text-center text-base font-medium text-texto transition hover:bg-superficie"
          >
            + Humor
          </Link>
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-borda bg-superficie px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
            Metas glicêmicas
          </h2>
          {podeEditar && (
            <Link
              href={`/perfil/${perfil.id}/metas/editar`}
              className="toque flex items-center rounded-lg border border-borda px-3 text-sm font-medium hover:bg-fundo"
            >
              Editar
            </Link>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-texto-suave">Faixa alvo</dt>
            <dd className="numero font-semibold">
              {metasEfetivas.alvoMin}–{metasEfetivas.alvoMax}
            </dd>
          </div>
          <div>
            <dt className="text-texto-suave">Hipo grave abaixo de</dt>
            <dd className="numero font-semibold">{metasEfetivas.limiteHipoGrave}</dd>
          </div>
          <div>
            <dt className="text-texto-suave">Hiper severa acima de</dt>
            <dd className="numero font-semibold">{metasEfetivas.limiteHiperSevera}</dd>
          </div>
        </dl>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/perfil/${perfil.id}/painel`}
          className="toque flex items-center justify-center rounded-xl border border-borda px-4 font-medium transition hover:bg-superficie"
        >
          Painel
        </Link>
        <Link
          href={`/perfil/${perfil.id}/historico`}
          className="toque flex items-center justify-center rounded-xl border border-borda px-4 font-medium transition hover:bg-superficie"
        >
          Histórico
        </Link>
        <Link
          href={`/perfil/${perfil.id}/relatorio`}
          className="toque flex items-center justify-center rounded-xl border border-borda px-4 font-medium transition hover:bg-superficie"
        >
          Relatório
        </Link>
        {podeEditar && (
          <Link
            href={`/perfil/${perfil.id}/compartilhar`}
            className="toque flex items-center justify-center rounded-xl border border-borda px-4 font-medium transition hover:bg-superficie"
          >
            Compartilhar
          </Link>
        )}
      </div>
    </main>
  );
}
