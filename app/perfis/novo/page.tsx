import Link from "next/link";
import { FormularioNovoPerfil } from "@/components/FormularioNovoPerfil";

export default function NovoPerfilPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-5 py-10 sm:py-14">
      <div className="flex flex-col gap-1.5">
        <Link href="/" className="text-sm text-texto-suave hover:underline">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold">Novo perfil</h1>
        <p className="text-sm text-texto-suave">
          Cada pessoa acompanhada tem seu próprio histórico e suas próprias metas — nada se
          mistura entre perfis.
        </p>
      </div>

      <FormularioNovoPerfil />
    </main>
  );
}
