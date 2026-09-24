"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { validarMetas, type CampoMeta } from "@/lib/perfil";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoFormularioMetas = {
  erros?: Partial<Record<CampoMeta, string>>;
  erroGeral?: string;
};

export async function atualizarMetas(
  perfilId: string,
  _estadoAnterior: EstadoFormularioMetas,
  formData: FormData,
): Promise<EstadoFormularioMetas> {
  const validacao = validarMetas({
    alvoMin: formData.get("alvoMin"),
    alvoMax: formData.get("alvoMax"),
    limiteHipoGrave: formData.get("limiteHipoGrave"),
    limiteHiperSevera: formData.get("limiteHiperSevera"),
  });

  if (!validacao.ok) {
    return { erros: validacao.erros };
  }

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { metas } = validacao;
  const { error } = await supabase
    .from("perfil_meta")
    .update({
      alvo_min: metas.alvoMin,
      alvo_max: metas.alvoMax,
      limite_hipo_grave: metas.limiteHipoGrave,
      limite_hiper_severa: metas.limiteHiperSevera,
    })
    .eq("perfil_id", perfilId);

  if (error) {
    return { erroGeral: "Não foi possível salvar as metas. Tente novamente." };
  }

  revalidatePath(`/perfil/${perfilId}`);
  redirect(`/perfil/${perfilId}`);
}
