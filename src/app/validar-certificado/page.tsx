import { Suspense } from "react";
import ValidarCertificadoClient from "./validar-certificado-client";

export default function ValidarCertificadoPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-[var(--foreground-muted)]">Carregando…</div>}>
      <ValidarCertificadoClient />
    </Suspense>
  );
}
