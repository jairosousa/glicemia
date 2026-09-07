import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FormularioGlicemia } from "@/components/FormularioGlicemia";
import { METAS_PADRAO } from "@/lib/glicemia";
import { linhaParaMetas, type Perfil, type PerfilMetaLinha } from "@/lib/perfil";
import { criarClienteServidor } from "@/lib/supabase/server";

export default async function NovaGlicemiaPage({
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

  if (!perfil) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-5 py-8 sm:py-12">
      <div className="flex flex-col gap-1.5">
        <Link href={`/perfil/${perfilId}`} className="text-sm text-texto-suave hover:underline">
          ← {perfil.nome}
        </Link>
        <h1 className="text-2xl font-bold">Registrar glicemia</h1>
      </div>

      <FormularioGlicemia
        perfilId={perfilId}
        perfilNome={perfil.nome}
        metas={metas ? linhaParaMetas(metas) : METAS_PADRAO}
        usuarioId={user.id}
      />
    </main>
  );
}
