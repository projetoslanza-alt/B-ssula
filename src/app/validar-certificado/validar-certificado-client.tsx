"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getCertificateByCode } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { BrandLogo } from "@/components/platform/brand-logo";
import { validatePublicCertificateAction } from "@/modules/learning/actions/certificate-actions";

type ValidationResult =
  | { kind: "demo"; studentName: string; courseName: string; workloadHours: number; completedAt: string }
  | { kind: "real"; status: string; certificate: Record<string, unknown> }
  | { kind: "invalid" };

export default function ValidarCertificadoClient() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") ?? searchParams.get("codigo") ?? "";
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const initial = searchParams.get("code") ?? searchParams.get("codigo");
    if (initial) handleValidate(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleValidate(rawCode?: string) {
    const value = (rawCode ?? code).trim();
    if (!value) return;

    startTransition(async () => {
      const demo = getCertificateByCode(value);
      if (demo) {
        setResult({
          kind: "demo",
          studentName: demo.studentName,
          courseName: demo.courseName,
          workloadHours: demo.workloadHours,
          completedAt: demo.completedAt,
        });
        return;
      }

      const response = await validatePublicCertificateAction(value);
      if (response.status === "not_found") {
        setResult({ kind: "invalid" });
        return;
      }

      setResult({
        kind: "real",
        status: response.status,
        certificate: (response.certificate ?? {}) as Record<string, unknown>,
      });
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center"><BrandLogo /></div>
        <Card>
          <CardContent className="space-y-4 p-6">
            <h1 className="text-center text-xl font-semibold">Validar certificado</h1>
            <p className="text-center text-sm text-[var(--foreground-muted)]">
              Consulta pública de autenticidade — UVC · Bússola by VendasComCiência
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleValidate();
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="code" className="mb-1 block text-sm font-medium">Código de validação</label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="BSS-2026-XXXXXX"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Validando…" : "Validar"}
              </Button>
            </form>

            {result?.kind === "demo" && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                <p className="font-medium text-amber-300">Certificado demonstrativo de homologação</p>
                <p className="mt-2">{result.studentName}</p>
                <p>{result.courseName}</p>
                <p>{result.workloadHours}h · {result.completedAt}</p>
              </div>
            )}

            {result?.kind === "real" && result.status === "valid" && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
                <p className="font-medium text-emerald-400">Certificado válido</p>
                <p className="mt-2">{String(result.certificate.student_name_snapshot ?? "")}</p>
                <p>{String(result.certificate.course_title_snapshot ?? "")}</p>
                <p>
                  {String(result.certificate.workload_hours_snapshot ?? "")}h ·{" "}
                  {result.certificate.issued_at
                    ? new Date(String(result.certificate.issued_at)).toLocaleDateString("pt-BR")
                    : ""}
                </p>
                <p className="text-[var(--foreground-muted)]">
                  Professor: {String(result.certificate.instructor_name_snapshot ?? "")}
                </p>
                <p className="text-[var(--foreground-muted)]">
                  {String(result.certificate.institution_snapshot ?? "")}
                </p>
              </div>
            )}

            {result?.kind === "real" && result.status === "revoked" && (
              <p className="text-center text-sm text-red-400" role="alert">Certificado revogado.</p>
            )}

            {result?.kind === "real" && result.status === "expired" && (
              <p className="text-center text-sm text-amber-400" role="alert">Certificado expirado.</p>
            )}

            {result?.kind === "invalid" && (
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
