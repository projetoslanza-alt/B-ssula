import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionContext, requirePermission } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/platform/status-badge";
import { platformRoutes } from "@/lib/routes";

export default async function AdminTrilhasPage() {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  try {
    requirePermission(session, "learning.path.manage");
  } catch {
    redirect("/acesso-negado");
  }

  const supabase = await createClient();
  const { data: paths } = await supabase
    .from("learning_paths")
    .select("id, title, slug, status, workload_minutes, archived_at")
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trilhas"
        description="Gerencie trilhas de aprendizagem da organização."
        backHref={platformRoutes.learning.adminCourses}
        actions={
          <Link href={platformRoutes.learning.adminPathNew} className="btn btn-primary btn-sm">
            + Nova trilha
          </Link>
        }
      />

      <ul className="space-y-2">
        {(paths ?? []).map((path) => (
          <li
            key={path.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-[var(--panel)] px-4 py-3"
          >
            <div>
              <Link href={platformRoutes.learning.adminPath(path.id)} className="font-medium hover:underline">
                {path.title}
              </Link>
              <p className="text-xs text-[var(--muted)]">{path.slug}</p>
            </div>
            <StatusBadge
              label={path.archived_at ? "arquivada" : path.status}
              tone={path.status === "published" ? "success" : "default"}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
