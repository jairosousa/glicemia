import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BotaoExcluirRegistro } from "@/components/BotaoExcluirRegistro";
import { EtiquetaFaixa } from "@/components/EtiquetaFaixa";
import { CONTEXTO_ROTULO, METAS_PADRAO, TIPO_INSULINA_ROTULO } from "@/lib/glicemia";
import {
  filtroTipoValido,
  formatarDataHora,
  periodoValido,
  unificarHistorico,
  PERIODOS_DISPONIVEIS,
  type FiltroTipo,
} from "@/lib/historico";
import { linhaParaMetas, type Perfil, type PerfilMetaLinha } from "@/lib/perfil";
import { criarClienteServidor } from "@/lib/supabase/server";

const ROTULO_FILTRO: Record<FiltroTipo, string> = {
  TODOS: "Todos",
  GLICEMIA: "Glicemia",
  INSULINA: "Insulina",
};

export default async function HistoricoPage({
  params,
  searchParams,
}: {
  params: Promise<{ perfilId: string }>;
  searchParams: Promise<{ periodo?: string; tipo?: string }>;
}) {
  const { perfilId } = await params;
  const { periodo: periodoParam, tipo: tipoParam } = await searchParams;
  const periodo = periodoValido(periodoParam);
  const filtroTipo = filtroTipoValido(tipoParam);

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: perfil }, { data: metasLinha }] = await Promise.all([
    supabase.from("perfil").select("*").eq("id", perfilId).single<Perfil>(),
    supabase.from("perfil_meta").select("*").eq("perfil_id", perfilId).single<PerfilMetaLinha>(),
  ]);

  if (!perfil) {
    notFound();
  }

  const metas = metasLinha ? linhaParaMetas(metasLinha) : METAS_PADRAO;

  const desde = new Date();
  desde.setDate(desde.getDate() - periodo);
  const desdeIso = desde.toISOString();

  const [{ data: glicemias }, { data: insulinas }] = await Promise.all([
    filtroTipo === "INSULINA"
      ? Promise.resolve({ data: [] })
      : supabase
          .from("medicao_glicemia")
          .select("id, data_hora, valor, contexto, observacao")
          .eq("perfil_id", perfilId)
          .gte("data_hora", desdeIso),
    filtroTipo === "GLICEMIA"
      ? Promise.resolve({ data: [] })
      : supabase
          .from("registro_insulina")
          .select("id, data_hora, tipo, unidades, observacao")
          .eq("perfil_id", perfilId)
          .gte("data_hora", desdeIso),
  ]);

  const itens = unificarHistorico(glicemias ?? [], insulinas ?? []);

  function hrefFiltro(novoPeriodo: number, novoTipo: FiltroTipo) {
    return `/perfil/${perfilId}/historico?periodo=${novoPeriodo}&tipo=${novoTipo}`;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:py-12">
      <div className="flex flex-col gap-1.5">
        <Link href={`/perfil/${perfilId}`} className="text-sm text-texto-suave hover:underline">
          ← {perfil.nome}
        </Link>
        <h1 className="text-2xl font-bold">Histórico</h1>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {PERIODOS_DISPONIVEIS.map((p) => (
            <Link
              key={p}
              href={hrefFiltro(p, filtroTipo)}
              className={`toque flex items-center rounded-lg border px-3 text-sm font-medium ${
                p === periodo
                  ? "border-texto bg-texto text-fundo"
                  : "border-borda text-texto hover:bg-superficie"
              }`}
            >
              {p} dias
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ROTULO_FILTRO) as FiltroTipo[]).map((t) => (
            <Link
              key={t}
              href={hrefFiltro(periodo, t)}
              className={`toque flex items-center rounded-lg border px-3 text-sm font-medium ${
                t === filtroTipo
                  ? "border-texto bg-texto text-fundo"
                  : "border-borda text-texto hover:bg-superficie"
              }`}
            >
              {ROTULO_FILTRO[t]}
            </Link>
          ))}
        </div>
      </div>

      {itens.length === 0 ? (
        <p className="rounded-xl border border-borda bg-superficie px-4 py-6 text-center text-sm text-texto-suave">
          Nenhum registro nos últimos {periodo} dias.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda">
          {itens.map((item) => (
            <li key={`${item.tipo}-${item.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex flex-col gap-1">
                {item.tipo === "GLICEMIA" ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="numero text-lg font-semibold">{item.valor} mg/dL</span>
                      <EtiquetaFaixa valor={item.valor} metas={metas} />
                    </div>
                    <p className="text-sm text-texto-suave">
                      {formatarDataHora(item.dataHora)} · {CONTEXTO_ROTULO[item.contexto]}
                      {item.observacao ? ` · ${item.observacao}` : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="numero text-lg font-semibold">{item.unidades} U</span>
                      <span className="faixa faixa-alvo">{TIPO_INSULINA_ROTULO[item.tipoInsulina]}</span>
                    </div>
                    <p className="text-sm text-texto-suave">
                      {formatarDataHora(item.dataHora)}
                      {item.observacao ? ` · ${item.observacao}` : ""}
                    </p>
                  </>
                )}
              </div>

              <BotaoExcluirRegistro
                tabela={item.tipo === "GLICEMIA" ? "medicao_glicemia" : "registro_insulina"}
                registroId={item.id}
                descricao={
                  item.tipo === "GLICEMIA"
                    ? `a glicemia de ${item.valor} mg/dL em ${formatarDataHora(item.dataHora)}`
                    : `a dose de ${item.unidades} U (${TIPO_INSULINA_ROTULO[item.tipoInsulina]}) em ${formatarDataHora(item.dataHora)}`
                }
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
