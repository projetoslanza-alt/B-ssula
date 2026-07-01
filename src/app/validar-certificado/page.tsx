"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getCertificateByCode } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { BrandLogo } from "@/components/platform/brand-logo";

export default function ValidarCertificadoPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ReturnType<typeof getCertificateByCode> | null | "invalid">(null);

  function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    const cert = getCertificateByCode(code.trim());
    setResult(cert ?? "invalid");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center"><BrandLogo /></div>
        <Card>
          <CardContent className="space-y-4 p-6">
            <h1 className="text-center text-xl font-semibold">Validar certificado</h1>
            <p className="text-center text-sm text-[var(--foreground-muted)]">
              Certificado demonstrativo de homologação
            </p>
            <form onSubmit={handleValidate} className="space-y-4">
              <div>
                <label htmlFor="code" className="mb-1 block text-sm font-medium">Código de validação</label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="BSS-2026-XXXXXX" required />
              </div>
              <Button type="submit" className="w-full">Validar</Button>
            </form>
            {result && result !== "invalid" && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
                <p className="font-medium text-emerald-400">Certificado válido (demonstração)</p>
                <p className="mt-2">{result.studentName}</p>
                <p>{result.courseName}</p>
                <p>{result.workloadHours}h · {result.completedAt}</p>
                <p className="text-[var(--foreground-muted)]">Empresa emissora: VendasComCiência</p>
              </div>
            )}
            {result === "invalid" && (
              <p className="text-center text-sm text-red-400" role="alert">
                Certificado não localizado ou código inválido.
              </p>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-[var(--foreground-disabled)]">
          <a href={platformRoutes.login} className="text-sky-400 hover:underline">Voltar ao login</a>
        </p>
      </div>
    </div>
  );
}
