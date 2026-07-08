import { createClient } from "@/lib/supabase/server";

export type AssignableMember = {
  id: string;
  fullName: string;
  email: string;
};

export async function listAssignableMembers(tenantId: string): Promise<AssignableMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_memberships")
    .select("user_id, profiles!user_id ( id, full_name, email )")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("created_at");

  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      if (!profile?.id) return null;
      return {
        id: profile.id,
        fullName: profile.full_name ?? profile.email ?? "Usuário",
        email: profile.email ?? "",
      };
    })
    .filter((m): m is AssignableMember => m !== null)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "pt-BR"));
}
