import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { getSessionContext } from "@/modules/core/auth/session";
import { CourseAdminLayout } from "@/modules/learning/components/course-admin-layout";
import { getPublishChecklistAction, publishCourseValidatedAction } from "@/modules/learning/actions/publish-actions";
import { CoursePublishControls } from "@/modules/learning/components/course-publish-controls";
import { Button } from "@/components/ui/button";

export default async function PublicarCursoPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  const checklist = await getPublishChecklistAction(courseId);
  const hasChecklist = "items" in checklist && Array.isArray(checklist.items);

  return (
    <CourseAdminLayout params={params} currentTab="publicar">
      <div className="max-w-xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Checklist de publicação</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Revise os requisitos antes de tornar o curso visível no catálogo.
          </p>
        </div>

        {"error" in checklist && checklist.error ? (
          <p className="text-red-600">{checklist.error}</p>
        ) : hasChecklist ? (
          <ul className="space-y-3">
            {checklist.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4"
              >
                {item.passed ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  {!item.passed && item.message && (
                    <p className="mt-1 text-sm text-[var(--muted)]">{item.message}</p>
                  )}
                  {item.href && !item.passed && (
                    <Link href={item.href} className="mt-2 inline-block text-sm text-amber-700 hover:underline">
                      Corrigir →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <form
          action={async () => {
            "use server";
            await publishCourseValidatedAction(courseId);
          }}
        >
          <Button type="submit" disabled={!("canPublish" in checklist && checklist.canPublish)}>
            Publicar curso agora
          </Button>
        </form>

        <CoursePublishControls courseId={courseId} />
      </div>
    </CourseAdminLayout>
  );
}
