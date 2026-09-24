import type { criarClienteNavegador } from "@/lib/supabase/client";

type ClienteNavegador = ReturnType<typeof criarClienteNavegador>;

const CHAVE_FILA = "glicemia:fila-offline";

/** Evento disparado sempre que a fila muda — para os componentes na mesma aba se atualizarem (o evento nativo "storage" só dispara em outras abas). */
const EVENTO_MUDOU = "glicemia:fila-offline-mudou";

export type TabelaFila = "medicao_glicemia" | "registro_insulina" | "refeicao" | "registro_humor";

type ItemFila = {
  tabela: TabelaFila;
  registro: Record<string, unknown>;
};

function lerFila(): ItemFila[] {
  try {
    const bruto = localStorage.getItem(CHAVE_FILA);
    return bruto ? (JSON.parse(bruto) as ItemFila[]) : [];
  } catch {
    return [];
  }
}

function salvarFila(fila: ItemFila[]) {
  try {
    localStorage.setItem(CHAVE_FILA, JSON.stringify(fila));
  } catch {
    // localStorage indisponível (modo privado, cota cheia) — sem fila local
    // nesse caso; o pior cenário é o mesmo erro que já existia antes do F10.
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_MUDOU));
  }
}

function enfileirar(tabela: TabelaFila, registro: Record<string, unknown>) {
  salvarFila([...lerFila(), { tabela, registro }]);
}

export function contarPendentes(): number {
  return lerFila().length;
}

/** Assina mudanças na fila (mesma aba). Devolve a função de cancelar a assinatura. */
export function assinarFila(ouvinte: () => void): () => void {
  window.addEventListener(EVENTO_MUDOU, ouvinte);
  return () => window.removeEventListener(EVENTO_MUDOU, ouvinte);
}

/**
 * Tenta gravar direto no Supabase; se falhar por rede (ou o navegador já
 * estiver offline), enfileira localmente e devolve pendente=true.
 *
 * Grava com `upsert`, não `insert`: o "id" do registro já vem gerado no
 * cliente (UUID, ver PROJECT.md §7), então reenviar o mesmo registro depois
 * de uma sincronização parcial é seguro — nunca duplica.
 */
export async function salvarOuEnfileirar(
  supabase: ClienteNavegador,
  tabela: TabelaFila,
  registro: Record<string, unknown>,
): Promise<{ pendente: boolean }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enfileirar(tabela, registro);
    return { pendente: true };
  }

  const { error } = await supabase.from(tabela).upsert(registro);

  if (error) {
    enfileirar(tabela, registro);
    return { pendente: true };
  }

  return { pendente: false };
}

/** Reenvia tudo que está na fila. Registros com sucesso saem; o resto permanece para a próxima tentativa. */
export async function sincronizarFila(supabase: ClienteNavegador): Promise<void> {
  const fila = lerFila();
  if (fila.length === 0) return;

  const restantes: ItemFila[] = [];

  for (const item of fila) {
    const { error } = await supabase.from(item.tabela).upsert(item.registro);
    if (error) {
      restantes.push(item);
    }
  }

  salvarFila(restantes);
}
