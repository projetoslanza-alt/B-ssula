import Link from "next/link";
import { ShieldX } from "lucide-react";
import { platformRoutes } from "@/lib/routes";

export default function AcessoNegadoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-6 text-center">
      <ShieldX className="mb-4 h-12 w-12 text-red-400" />
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">Acesso negado</h1>
      <p className="mt-3 max-w-md text-[var(--foreground-muted)]">
        Você não tem permissão para acessar este recurso. Se acredita que isso é um erro, contate o
        administrador da sua organização.
      </p>
      <Link
        href={platformRoutes.home}
        className="mt-6 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
