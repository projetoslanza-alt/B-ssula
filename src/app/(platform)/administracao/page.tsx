import Link from "next/link";
import { requireAnyPermission } from "@/lib/auth/page-guard";
import { hasAnyPermission, hasPermission } from "@/modules/core/auth/session";
import { AdminModuleCard } from "@/components/platform/admin-module-card";
import { DataTable, DataTableCell, DataTableRow } from "@/components/platform/data-table";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getRecentAuditEvents } from "@/modules/admin/queries/audit";
import { platformRoutes } from "@/lib/routes";

const ADMIN_MODULES = [
  {
    badge: "Estrutura",
    badgeTone: "info" as const,
    title: "Usuários e equipes",
    description: "Gerencie colaboradores, gestores, equipes, cargos e operações.",
    href: platformRoutes.admin.users,
    permissionsAny: ["platform.users.manage", "platform.users.status"],
  },
  {
    badge: "Universidade",
    badgeTone: "purple" as const,
    title: "Cursos e certificados",
    description: "Configure conteúdos, avaliações, modelos e critérios de emissão.",
    href: platformRoutes.learning.adminCourses,
    permission: "learning.course.create",
  },
  {
    badge: "Chamados",
    badgeTone: "warning" as const,
    title: "Filas e categorias",
    description: "Defina responsáveis, SLAs, prioridades e respostas prontas.",
    href: platformRoutes.support.admin,
    permission: "support.settings.manage",
  },
  {
    badge: "Segurança",
    badgeTone: "success" as const,
    title: "Perfis e permissões",
    description: "Controle o acesso aos módulos e aos dados da organização.",
    href: platformRoutes.admin.permissions,
    permission: "platform.users.manage",
  },
  {
    badge: "Gamificação",
    badgeTone: "warning" as const,
    title: "Campanhas e pontuação",
    description: "Configure regras, metas, premiações, rankings e auditoria.",
    href: `${platformRoutes.gamification.root}?tab=central`,
    permissionsAny: [
      "gamification.campaign.create",
      "gamification.campaign.publish",
      "gamification.campaign.pause",
      "gamification.campaign.close",
      "gamification.campaign.edit",
    ],
  },
];

export default async function AdministracaoPage() {
  const session = await requireAnyPermission([
    "platform.users.manage",
    "platform.users.status",
    "platform.organization.manage",
    "support.settings.manage",
    "gamification.campaign.publish",
  ]);
  const auditEvents = await getRecentAuditEvents(session.tenantId, 5);
  const visibleModules = ADMIN_MODULES.filter((mod) =>
    mod.permissionsAny
      ? hasAnyPermission(session, mod.permissionsAny)
      : mod.permission
        ? hasPermission(session, mod.permission)
        : true,
  );
  const canCreateUser = hasPermission(session, "platform.users.manage");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CONFIGURAÇÕES"
        title="Administração"
        description="Gerencie estrutura, conteúdos, permissões e auditoria."
        actions={
          canCreateUser ? (
            <Button asChild>
              <Link href={platformRoutes.admin.usersNew}>+ Novo usuário</Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {visibleModules.slice(0, 4).map((mod) => (
          <AdminModuleCard key={mod.href} {...mod} />
        ))}
      </div>
      {visibleModules[4] && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminModuleCard {...visibleModules[4]} className="xl:col-span-1" />
        </div>
      )}

      <Card className="border-[var(--border)] bg-[var(--panel)]">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)]">Auditoria recente</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Últimas alterações relevantes realizadas no sistema.</p>
            </div>
            <Link href={platformRoutes.admin.audit} className="text-sm text-sky-400 hover:underline">
              Ver tudo
            </Link>
          </div>
          {auditEvents.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
              Nenhum evento de auditoria registrado ainda.
            </p>
          ) : (
            <DataTable
              columns={[
                { key: "date", label: "Data" },
                { key: "user", label: "Usuário" },
                { key: "action", label: "Ação" },
                { key: "module", label: "Módulo" },
                { key: "details", label: "Detalhes" },
              ]}
            >
              {auditEvents.map((event) => (
                <DataTableRow key={event.id}>
                  <DataTableCell className="whitespace-nowrap text-[var(--muted)]">
                    {new Date(event.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </DataTableCell>
                  <DataTableCell>{event.actorName}</DataTableCell>
                  <DataTableCell>{event.action}</DataTableCell>
                  <DataTableCell className="text-[var(--muted)]">{event.module}</DataTableCell>
                  <DataTableCell className="text-[var(--muted)]">{event.details}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
