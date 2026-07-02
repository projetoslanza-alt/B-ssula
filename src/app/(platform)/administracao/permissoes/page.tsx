import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { platformRoutes } from "@/lib/routes";
import { hasPermission } from "@/modules/core/auth/session";

const MODULE_LABELS: Record<string, string> = {
  platform: "Plataforma",
  support: "Chamados",
  learning: "Universidade",
  gamification: "Gamificação",
  news: "News",
  reports: "Relatórios",
  audit: "Auditoria",
  crm: "Comercial",
  "north-conversation": "Conversa de Norte",
};

export default async function PermissoesPage() {
  const session = await requirePagePermission("platform.users.manage");
  const supabase = await createClient();
  const canEdit = hasPermission(session, "platform.users.manage");

  const { data: permissions } = await supabase
    .from("permissions")
    .select("id, code, name, module, description")
    .order("module")
    .order("code");

  const grouped = (permissions ?? []).reduce<Record<string, typeof permissions>>((acc, perm) => {
    const mod = perm.module ?? "outros";
    acc[mod] = acc[mod] ?? [];
    acc[mod].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <PageHeader
        title="Matriz de permissões"
        subtitle="Alterações impactam todos os usuários do grupo. Confirme antes de salvar."
        backHref={platformRoutes.admin.root}
      />
      {Object.entries(grouped).map(([module, perms]) => (
        <Card key={module}>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold">{MODULE_LABELS[module] ?? module}</h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {(perms ?? []).map((perm) => (
                <li key={perm.id} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 text-sm">
                  <p className="font-medium text-[var(--foreground)]">{perm.name}</p>
                  <p className="mt-1 text-[var(--muted)]">{perm.description ?? "Sem descrição cadastrada."}</p>
                  <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                    Escopo: {module === "support" ? "Equipe/Tenant" : "Tenant"} · Status: Ativa
                  </p>
                  {canEdit && (
                    <p className="mt-1 font-mono text-[10px] text-[var(--foreground-disabled)]">{perm.code}</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
