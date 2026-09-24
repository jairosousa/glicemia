"use client";

/** Aciona a caixa de impressão do navegador. Some da própria página impressa. */
export function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print toque rounded-lg bg-texto px-4 font-medium text-fundo"
    >
      🖨️ Imprimir
    </button>
  );
}
