import Link from "next/link";
import { requirePageSession } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/platform/status-badge";
import { createClient } from "@/lib/supabase/server";
import { platformRoutes } from "@/lib/routes";

export default async function CertificadosPage() {
  const session = await requirePageSession();
  const supabase = await createClient();

  const { data: certificates } = await supabase
    .from("certificates")
    .select(
      "id, validation_code, course_title_snapshot, student_name_snapshot, workload_hours_snapshot, issued_at, status, is_demo",
    )
    .eq("user_id", session.userId)
    .order("issued_at", { ascending: false });

  const list = certificates ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        subtitle="Reconhecimentos conquistados ao longo da sua jornada."
        title="Certificados"
        backHref={platformRoutes.learning.root}
      />

      {list.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-[var(--foreground-muted)]">
            Nenhum certificado emitido ainda. Conclua os requisitos do curso para solicitar emissão.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((cert) => (
            <Card key={cert.id} className="overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-violet-500 to-sky-500" />
              <CardContent className="space-y-4 p-6">
                <div className="flex justify-between gap-2">
                  <h3 className="font-semibold">{cert.course_title_snapshot}</h3>
                  <StatusBadge label={cert.status} tone="success" />
                </div>
                {cert.is_demo && (
                  <p className="text-xs text-amber-400">Homologação QA — não é certificado de produção</p>
                )}
                <p className="text-sm text-[var(--foreground-muted)]">{cert.student_name_snapshot}</p>
                <p className="text-sm">
                  Conclusão:{" "}
                  {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString("pt-BR") : "—"} ·{" "}
                  {cert.workload_hours_snapshot}h
                </p>
                <p className="font-mono text-xs text-sky-400">{cert.validation_code}</p>
                <Link
                  href={`${platformRoutes.certificateValidation}?codigo=${encodeURIComponent(cert.validation_code)}`}
                  className="text-sm text-[var(--primary)] hover:underline"
                >
                  Validar publicamente
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
