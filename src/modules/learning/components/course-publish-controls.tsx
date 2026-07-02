"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { scheduleCoursePublishAction, unpublishCourseAction, archiveCourseAction } from "@/modules/learning/actions/publication-actions";

export function CoursePublishControls({ courseId }: { courseId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <h3 className="font-semibold">Agendar publicação</h3>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            await scheduleCoursePublishAction(courseId, fd);
            router.refresh();
          });
        }}
      >
        <Input type="datetime-local" name="scheduledAt" required className="max-w-xs" />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>Agendar</Button>
      </form>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            await unpublishCourseAction(courseId, fd);
            router.refresh();
          });
        }}
      >
        <h3 className="font-semibold">Despublicar</h3>
        <Input name="reason" placeholder="Motivo (obrigatório)" required minLength={3} />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>Despublicar</Button>
      </form>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            await archiveCourseAction(courseId, fd);
            router.refresh();
          });
        }}
      >
        <h3 className="font-semibold">Arquivar curso</h3>
        <Input name="reason" placeholder="Motivo (obrigatório)" required minLength={3} />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>Arquivar</Button>
      </form>
    </div>
  );
}
