import { redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { createMembershipUserAction } from "@/modules/admin/actions/user-actions";
import { platformRoutes } from "@/lib/routes";

export default async function NovoUsuarioPage() {
  const session = await requirePagePermission("platform.users.manage");
  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("access_groups")
    .select("id, name, code")
    .eq("tenant_id", session.tenantId)
    .order("name");

  async function createUser(formData: FormData) {
    "use server";
    const membershipId = await createMembershipUserAction(formData);
    redirect(platformRoutes.admin.user(membershipId));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo usuário"
        description="Vincule um colaborador à organização e atribua um grupo de acesso."
        backHref={platformRoutes.admin.users}
      />
      <form action={createUser} className="max-w-lg space-y-4 rounded-xl border border-[var(--border)] p-4">
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm">
            Nome completo
          </label>
          <Input id="fullName" name="fullName" required />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm">
            E-mail
          </label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <label htmlFor="groupId" className="mb-1 block text-sm">
            Grupo de acesso
          </label>
          <select
            id="groupId"
            name="groupId"
            className="h-[42px] w-full rounded-[11px] border border-[var(--border)] bg-[#0b121c] px-3 text-sm"
          >
            <option value="">Selecione...</option>
            {(groups ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">Criar vínculo</Button>
      </form>
    </div>
  );
}
