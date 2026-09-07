import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GraficoGlicemia } from "@/components/GraficoGlicemia";
import { calcularEstatisticas } from "@/lib/estatisticas";
import { METAS_PADRAO } from "@/lib/glicemia";
import { periodoValido, PERIODOS_DISPONIVEIS } from "@/lib/historico";
import { linhaParaMetas, type Perfil, type PerfilMetaLinha } from "@/lib/perfil";
import { criarClienteServidor } from "@/lib/supabase/server";

export default async function PainelPage({
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

  const { data: glicemias } = await supabase
    .from("medicao_glicemia")
    .select("data_hora, valor")
    .eq("perfil_id", perfilId)
    .gte("data_hora", desde.toISOString())
    .returns<{ data_hora: string; valor: number }[]>();

  const pontos = glicemias ?? [];
  const estatisticas = calcularEstatisticas(
    pontos.map((p) => p.valor),
    metas,
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:py-12">
      <div className="flex flex-col gap-1.5">
        <Link href={`/perfil/${perfilId}`} className="text-sm text-texto-suave hover:underline">
          ← {perfil.nome}
        </Link>
        <h1 className="text-2xl font-bold">Painel</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODOS_DISPONIVEIS.map((p) => (
          <Link
            key={p}
            href={`/perfil/${perfilId}/painel?periodo=${p}`}
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

      {estatisticas.totalMedicoes === 0 ? (
        <p className="rounded-xl border border-borda bg-superficie px-4 py-6 text-center text-sm text-texto-suave">
          Nenhuma medição nos últimos {periodo} dias.
        </p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CartaoEstatistica
              rotulo="Na faixa"
              valor={`${estatisticas.percentualNaFaixa}%`}
              detalhe={`${estatisticas.naFaixa} de ${estatisticas.totalMedicoes} medições`}
              destaque="alvo"
            />
            <CartaoEstatistica
              rotulo="Média"
              valor={`${estatisticas.media}`}
              detalhe="mg/dL"
            />
            <CartaoEstatistica
              rotulo="Desvio padrão"
              valor={`±${estatisticas.desvioPadrao}`}
              detalhe="mg/dL"
            />
            <CartaoEstatistica
              rotulo="Fora da faixa"
              valor={`${estatisticas.abaixo + estatisticas.acima}`}
              detalhe={`${estatisticas.abaixo} abaixo · ${estatisticas.acima} acima`}
            />
          </section>

          {(estatisticas.hipoGrave > 0 || estatisticas.hiperSevera > 0) && (
            <p className="faixa faixa-hipo-grave text-sm">
              Atenção: {estatisticas.hipoGrave} hipoglicemia(s) grave(s) e {estatisticas.hiperSevera}{" "}
              hiperglicemia(s) severa(s) neste período.
            </p>
          )}

          <GraficoGlicemia pontos={pontos.map((p) => ({ dataHora: p.data_hora, valor: p.valor }))} metas={metas} />

          <p className="text-xs text-texto-suave">
            % de medições na faixa, não tempo no alvo (TIR) clínico — este cálculo usa as
            medições manuais registradas, não um sensor contínuo.
          </p>
        </>
      )}
    </main>
  );
}

function CartaoEstatistica({
  rotulo,
  valor,
  detalhe,
  destaque,
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  destaque?: "alvo";
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-borda bg-superficie px-3 py-3">
      <span className="text-xs font-medium uppercase tracking-wide text-texto-suave">{rotulo}</span>
      <span className={`numero text-2xl font-bold ${destaque === "alvo" ? "text-alvo" : ""}`}>
        {valor}
      </span>
      <span className="text-xs text-texto-suave">{detalhe}</span>
    </div>
  );
}
