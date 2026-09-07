import { CLASSIFICACAO_INFO, classificar, type Metas } from "@/lib/glicemia";

type Props = {
  /** Valor da glicemia em mg/dL. */
  valor: number;
  /** Metas do perfil. Omitido, usa as metas padrão de adulto tipo 1. */
  metas?: Metas;
  /** `curto` para listas, `longo` para a confirmação de um registro. */
  detalhe?: "curto" | "longo";
};

/**
 * Etiqueta de classificação de uma glicemia.
 *
 * Sempre renderiza os três canais de comunicação juntos — cor de fundo, ícone e
 * texto. O ícone recebe `aria-hidden` porque é decorativo: quem usa leitor de
 * tela recebe a informação pelo texto, que é o canal confiável.
 */
export function EtiquetaFaixa({ valor, metas, detalhe = "curto" }: Props) {
  const classificacao = classificar(valor, metas);
  const info = CLASSIFICACAO_INFO[classificacao];

  return (
    <span className={`faixa ${info.classe}`}>
      <span aria-hidden="true">{info.icone}</span>
      {detalhe === "curto" ? info.curto : info.longo}
    </span>
  );
}
