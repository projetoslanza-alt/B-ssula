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
      <h1 className="text-xl font-semibold text-[var(--foreground)]">Não foi possível carregar esta página</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {error.digest ? `Referência: ${error.digest}` : "Ocorreu um erro inesperado."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary btn-sm">
          Tentar novamente
        </button>
        <Link href={platformRoutes.home} className="btn btn-secondary btn-sm">
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
