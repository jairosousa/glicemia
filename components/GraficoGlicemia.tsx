"use client";

import {
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { classificar, type Classificacao, type Metas } from "@/lib/glicemia";

type Ponto = { dataHora: string; valor: number };

type Props = {
  pontos: Ponto[];
  metas: Metas;
};

/**
 * Cores por classificação, para os pontos do gráfico.
 *
 * Duplicam os valores "sólidos" de app/globals.css de propósito: o Recharts
 * desenha em SVG via JavaScript, então não consegue ler `var(--cor)` do CSS
 * de forma confiável — precisa do valor hexadecimal literal.
 */
const COR_CLASSIFICACAO: Record<Classificacao, string> = {
  HIPO_GRAVE: "#991b1b",
  HIPO: "#dc2626",
  ALVO: "#15803d",
  HIPER: "#b45309",
  HIPER_SEVERA: "#c2410c",
};

const COR_LINHA = "#71717a"; // zinc-500 — neutro, legível em tema claro e escuro
const COR_FAIXA_ALVO = "rgba(21, 128, 61, 0.14)";

function PontoColorido(props: { cx?: number; cy?: number; payload?: { valor: number }; metas: Metas }) {
  const { cx, cy, payload, metas } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  const cor = COR_CLASSIFICACAO[classificar(payload.valor, metas)];
  return <circle cx={cx} cy={cy} r={4} fill={cor} stroke="var(--fundo)" strokeWidth={1.5} />;
}

export function GraficoGlicemia({ pontos, metas }: Props) {
  if (pontos.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-borda bg-superficie text-sm text-texto-suave">
        Sem medições no período para desenhar o gráfico.
      </div>
    );
  }

  const dados = pontos
    .map((p) => ({ x: new Date(p.dataHora).getTime(), valor: p.valor }))
    .sort((a, b) => a.x - b.x);

  const valores = dados.map((d) => d.valor);
  const minDominio = Math.max(20, Math.min(...valores, metas.alvoMin) - 20);
  const maxDominio = Math.min(600, Math.max(...valores, metas.alvoMax) + 20);

  return (
    <div className="rounded-xl border border-borda bg-superficie p-3">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={dados} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <ReferenceArea
            y1={metas.alvoMin}
            y2={metas.alvoMax}
            fill={COR_FAIXA_ALVO}
            ifOverflow="extendDomain"
            label={{ value: "Alvo", position: "insideTopLeft", fontSize: 11, fill: "#15803d" }}
          />
          <ReferenceLine
            y={metas.limiteHipoGrave}
            stroke={COR_CLASSIFICACAO.HIPO_GRAVE}
            strokeDasharray="4 4"
          />
          <ReferenceLine
            y={metas.limiteHiperSevera}
            stroke={COR_CLASSIFICACAO.HIPER_SEVERA}
            strokeDasharray="4 4"
          />
          <XAxis
            dataKey="x"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(ts) =>
              new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
            }
            tick={{ fontSize: 11, fill: "var(--texto-suave)" }}
            stroke="var(--borda)"
          />
          <YAxis
            domain={[minDominio, maxDominio]}
            tick={{ fontSize: 11, fill: "var(--texto-suave)" }}
            stroke="var(--borda)"
            width={40}
          />
          <Tooltip
            labelFormatter={(ts) =>
              new Date(ts as number).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            }
            formatter={(valor) => [`${valor} mg/dL`, "Glicemia"]}
            contentStyle={{
              background: "var(--fundo)",
              border: "1px solid var(--borda)",
              borderRadius: 8,
              fontSize: 13,
            }}
          />
          <Line
            type="monotone"
            dataKey="valor"
            stroke={COR_LINHA}
            strokeWidth={1.5}
            dot={<PontoColorido metas={metas} />}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
