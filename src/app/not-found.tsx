import Link from "next/link";
import { Compass } from "lucide-react";
import { platformRoutes } from "@/lib/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Compass className="h-12 w-12 text-amber-600" aria-hidden />
      <h1 className="mt-6 text-2xl font-semibold text-slate-900">Rota não encontrada</h1>
      <p className="mt-2 max-w-md text-slate-600">
        Esta página não faz parte do mapa atual da Bússola. Verifique o endereço ou volte ao início.
      </p>
      <Link
        href={platformRoutes.home}
        className="mt-8 inline-flex rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Ir para o início
      </Link>
    </div>
  );
}
