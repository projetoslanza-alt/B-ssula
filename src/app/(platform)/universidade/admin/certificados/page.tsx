import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionContext, hasAnyPermission } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { UniversityAdminShell } from "@/modules/learning/components/university-admin-shell";
import { platformRoutes } from "@/lib/routes";

export default async function AdminCertificadosPage() {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");
  if (
    !hasAnyPermission(session, [
      "learning.certificate.view_all",
      "learning.certificate.issue",
      "learning.course.create",
      "learning.enrollment.manage",
    ])
  ) {
    redirect("/acesso-negado");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("certificates")
    .select("id, status, issued_at, course_title_snapshot, student_name_snapshot")
    .eq("tenant_id", session.tenantId)
    .order("issued_at", { ascending: false })
    .limit(50);

  return (
    <UniversityAdminShell
      title="Gestão da Universidade"
      description="Certificados emitidos na organização."
      current="certificados"
    >
      {(data ?? []).length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Nenhum certificado emitido ainda.{" "}
          <Link href={platformRoutes.learning.certificates} className="text-sky-400 hover:underline">
            Ver área do aluno
          </Link>
        </p>
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((cert) => (
            <li
              key={cert.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{cert.student_name_snapshot ?? "Usuário"}</p>
                <p className="text-[var(--muted)]">{cert.course_title_snapshot ?? "Curso"}</p>
              </div>
              <span className="text-[var(--muted)]">
                {cert.status}
                {cert.issued_at
                  ? ` · ${new Date(cert.issued_at).toLocaleDateString("pt-BR")}`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </UniversityAdminShell>
  );
}
