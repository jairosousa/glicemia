import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BotaoImprimir } from "@/components/BotaoImprimir";
import { EtiquetaFaixa } from "@/components/EtiquetaFaixa";
import { calcularEstatisticas } from "@/lib/estatisticas";
import { CONTEXTO_ROTULO, METAS_PADRAO, TIPO_INSULINA_ROTULO } from "@/lib/glicemia";
import { formatarDataHora, periodoValido, PERIODOS_DISPONIVEIS } from "@/lib/historico";
import { calcularIdade, linhaParaMetas, type Perfil, type PerfilMetaLinha } from "@/lib/perfil";
import { criarClienteServidor } from "@/lib/supabase/server";

/**
 * Relatório para impressão (PROJECT.md F9) — vai para a consulta médica.
 * Leitura aberta a PACIENTE e OBSERVADOR: é justamente o que a esposa
 * precisa gerar sozinha (§4.2, F8).
 */
export default async function RelatorioPage({
  params,
  searchParams,
}: {
  params: Promise<{ perfilId: string }>;
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { perfilId } = await params;
  const { periodo: periodoParam } = await searchParams;
  const periodo = periodoValido(periodoParam);

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
    supabase
      .from("medicao_glicemia")
      .select("id, data_hora, valor, contexto, observacao")
      .eq("perfil_id", perfilId)
      .gte("data_hora", desdeIso)
      .order("data_hora", { ascending: true })
      .returns<{ id: string; data_hora: string; valor: number; contexto: keyof typeof CONTEXTO_ROTULO; observacao: string | null }[]>(),
    supabase
      .from("registro_insulina")
      .select("id, data_hora, tipo, unidades, observacao")
      .eq("perfil_id", perfilId)
      .gte("data_hora", desdeIso)
      .order("data_hora", { ascending: true })
      .returns<{ id: string; data_hora: string; tipo: keyof typeof TIPO_INSULINA_ROTULO; unidades: number; observacao: string | null }[]>(),
  ]);

  const medicoes = glicemias ?? [];
  const doses = insulinas ?? [];
  const estatisticas = calcularEstatisticas(
    medicoes.map((m) => m.valor),
    metas,
  );

  const hoje = new Date().toLocaleDateString("pt-BR");
  const inicioPeriodo = desde.toLocaleDateString("pt-BR");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-8 sm:py-12 print:px-0 print:py-0">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Link href={`/perfil/${perfilId}`} className="text-sm text-texto-suave hover:underline">
            ← {perfil.nome}
          </Link>
          <h1 className="text-2xl font-bold">Relatório para impressão</h1>
        </div>
        <BotaoImprimir />
      </div>

      <div className="no-print flex flex-wrap gap-2">
        {PERIODOS_DISPONIVEIS.map((p) => (
          <Link
            key={p}
            href={`/perfil/${perfilId}/relatorio?periodo=${p}`}
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

      <article className="flex flex-col gap-6">
        <header className="flex flex-col gap-1 border-b border-borda pb-4">
          <h2 className="text-xl font-bold">Relatório de acompanhamento — Glicemia</h2>
          <p className="text-sm text-texto-suave">
            Paciente: <strong className="text-texto">{perfil.nome}</strong> ·{" "}
            {calcularIdade(perfil.data_nascimento)} anos
          </p>
          <p className="text-sm text-texto-suave">
            Período: {inicioPeriodo} a {hoje} ({periodo} dias) · Emitido em {hoje}
          </p>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CartaoResumo
            rotulo="Na faixa"
            valor={estatisticas.percentualNaFaixa !== null ? `${estatisticas.percentualNaFaixa}%` : "—"}
            detalhe={
              estatisticas.totalMedicoes > 0
                ? `${estatisticas.naFaixa} de ${estatisticas.totalMedicoes} medições`
                : "sem medições"
            }
          />
          <CartaoResumo
            rotulo="Média"
            valor={estatisticas.media !== null ? `${estatisticas.media}` : "—"}
            detalhe="mg/dL"
          />
          <CartaoResumo
            rotulo="Desvio padrão"
            valor={estatisticas.desvioPadrao !== null ? `±${estatisticas.desvioPadrao}` : "—"}
            detalhe="mg/dL"
          />
          <CartaoResumo
            rotulo="Fora da faixa"
            valor={`${estatisticas.abaixo + estatisticas.acima}`}
            detalhe={`${estatisticas.abaixo} abaixo · ${estatisticas.acima} acima`}
          />
        </section>

        <p className="text-xs text-texto-suave">
          % de medições na faixa, não tempo no alvo (TIR) clínico — este cálculo usa as medições
          manuais registradas, não um sensor contínuo.
        </p>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
            Medições de glicemia ({medicoes.length})
          </h3>
          {medicoes.length === 0 ? (
            <p className="text-sm text-texto-suave">Nenhuma medição neste período.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-borda text-left text-texto-suave">
                  <th className="py-1.5 pr-2 font-medium">Data/hora</th>
                  <th className="py-1.5 pr-2 font-medium">Contexto</th>
                  <th className="py-1.5 pr-2 font-medium">Valor</th>
                  <th className="py-1.5 font-medium">Classificação</th>
                </tr>
              </thead>
              <tbody>
                {medicoes.map((m) => (
                  <tr key={m.id} className="border-b border-borda/50">
                    <td className="numero py-1.5 pr-2">{formatarDataHora(m.data_hora)}</td>
                    <td className="py-1.5 pr-2">{CONTEXTO_ROTULO[m.contexto]}</td>
                    <td className="numero py-1.5 pr-2 font-semibold">{m.valor} mg/dL</td>
                    <td className="py-1.5">
                      <EtiquetaFaixa valor={m.valor} metas={metas} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
            Insulina aplicada ({doses.length})
          </h3>
          {doses.length === 0 ? (
            <p className="text-sm text-texto-suave">Nenhuma dose registrada neste período.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-borda text-left text-texto-suave">
                  <th className="py-1.5 pr-2 font-medium">Data/hora</th>
                  <th className="py-1.5 pr-2 font-medium">Tipo</th>
                  <th className="py-1.5 font-medium">Unidades</th>
                </tr>
              </thead>
              <tbody>
                {doses.map((d) => (
                  <tr key={d.id} className="border-b border-borda/50">
                    <td className="numero py-1.5 pr-2">{formatarDataHora(d.data_hora)}</td>
                    <td className="py-1.5 pr-2">{TIPO_INSULINA_ROTULO[d.tipo]}</td>
                    <td className="numero py-1.5 font-semibold">{d.unidades} U</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="rounded-xl border border-borda bg-superficie px-4 py-4 text-sm text-texto-suave">
          <strong className="font-semibold text-texto">Aviso médico.</strong> Este aplicativo é uma
          ferramenta de registro e visualização. Não substitui avaliação médica, não emite
          diagnóstico e não recomenda doses de medicamento. Toda decisão de tratamento é da equipe
          de saúde.
        </footer>
      </article>
    </main>
  );
}

function CartaoResumo({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-borda bg-superficie px-3 py-3">
      <span className="text-xs font-medium uppercase tracking-wide text-texto-suave">{rotulo}</span>
      <span className="numero text-2xl font-bold">{valor}</span>
      <span className="text-xs text-texto-suave">{detalhe}</span>
    </div>
  );
}
