"use client";

import Link from "next/link";
import { platformRoutes } from "@/lib/routes";

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Não foi possível carregar esta página</h1>
      <p className="mt-2 text-sm text-slate-600">
        {error.digest ? `Referência: ${error.digest}` : "Ocorreu um erro inesperado."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
          Tentar novamente
        </button>
        <Link href={platformRoutes.home} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
