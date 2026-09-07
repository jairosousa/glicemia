/**
 * Conversão entre `Date` e o formato que o input `datetime-local` exige
 * (`AAAA-MM-DDTHH:mm`, sempre no horário local do aparelho — nunca em UTC).
 *
 * `date.toISOString()` não serve aqui porque converte para UTC, o que
 * mostraria um horário errado para quem está em fuso diferente de Londres.
 */
export function paraDatetimeLocal(data: Date): string {
  const preencher = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${preencher(data.getMonth() + 1)}-${preencher(data.getDate())}T${preencher(data.getHours())}:${preencher(data.getMinutes())}`;
}

/** Converte o valor de um input `datetime-local` de volta para `Date`. */
export function deDatetimeLocal(valor: string): Date {
  return new Date(valor);
}
