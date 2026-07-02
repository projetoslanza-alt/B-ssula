import { notFound, redirect } from "next/navigation";
import { requirePageSession } from "@/lib/auth/page-guard";
import { unwrapRelation } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";
import { NorthConversationWizard } from "@/modules/north-conversation/components/north-conversation-wizard";
import { NovaConversaStarter } from "@/modules/north-conversation/components/nova-conversa-starter";
import {
  getPreviousMeetingComparison,
  listTeamMembersForMeeting,
} from "@/modules/north-conversation/queries/conversations";
import { PageHeader } from "@/components/platform/page-header";
import { platformRoutes } from "@/lib/routes";
import { hasPermission } from "@/modules/core/auth/session";

export default async function NovaConversaPage({
  searchParams,
}: {
  searchParams: Promise<{ meetingId?: string }>;
}) {
  const session = await requirePageSession();
  const params = await searchParams;
  const canCreateMeeting = hasPermission(session, "one_on_one.meeting.create");
  const canManageMeeting = hasPermission(session, "one_on_one.meeting.manage");

  if (!params.meetingId) {
    if (!canCreateMeeting) redirect("/acesso-negado");
    const employees = await listTeamMembersForMeeting(session.tenantId, session.userId);
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Nova Conversa de Norte"
          description="Metodologia Venda ComCiência — One a One estruturado."
          backHref={platformRoutes.northConversation.root}
        />
        <NovaConversaStarter employees={employees} />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: meeting } = await supabase
    .from("one_on_one_meetings")
    .select(`
      id, employee_id, manager_id, status, company_snapshot,
      employee:profiles!one_on_one_meetings_employee_id_fkey ( full_name, email )
    `)
    .eq("id", params.meetingId)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();

  if (!meeting) notFound();

  const isParticipant =
    meeting.employee_id === session.userId || meeting.manager_id === session.userId;
  if (!canManageMeeting && !isParticipant) notFound();

  const [{ data: blocks }, previousCycle] = await Promise.all([
    supabase
      .from("one_on_one_meeting_blocks")
      .select("block_key, payload")
      .eq("meeting_id", params.meetingId)
      .eq("tenant_id", session.tenantId),
    getPreviousMeetingComparison(session.tenantId, params.meetingId),
  ]);

  const initialBlocks = Object.fromEntries((blocks ?? []).map((b) => [b.block_key, b.payload as Record<string, unknown>]));
  const employeeProfile = unwrapRelation(meeting.employee);
  const employeeName = employeeProfile?.full_name ?? employeeProfile?.email ?? "Colaborador";
  const employees =
    session.userId === meeting.manager_id
      ? await listTeamMembersForMeeting(session.tenantId, session.userId)
      : [{ id: meeting.employee_id, name: employeeName }];
  const employeeExists = employees.some((employee) => employee.id === meeting.employee_id);
  const employeeList = employeeExists ? employees : [...employees, { id: meeting.employee_id, name: employeeName }];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversa de Norte — Wizard"
        description="12 blocos com autosave e metodologia Venda ComCiência."
        backHref={platformRoutes.northConversation.root}
      />
      <NorthConversationWizard
        meetingId={params.meetingId}
        companyName={meeting.company_snapshot ?? session.tenantName}
        employees={employeeList}
        initialBlocks={initialBlocks}
        previousCycle={previousCycle ?? undefined}
        canEditSelfAssessment={session.userId === meeting.employee_id && meeting.status !== "completed"}
        isManager={session.userId === meeting.manager_id}
        employeeId={meeting.employee_id}
        sessionUserId={session.userId}
      />
    </div>
  );
}
