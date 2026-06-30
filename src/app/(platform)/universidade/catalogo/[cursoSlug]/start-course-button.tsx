"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { startCourseAction } from "@/modules/learning/actions/enrollment-actions";

export function StartCourseButton({
  courseId,
  hasEnrollment,
  enrollmentId,
  progress,
}: {
  courseId: string;
  hasEnrollment: boolean;
  enrollmentId?: string;
  progress: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleStart() {
    startTransition(async () => {
      if (hasEnrollment && enrollmentId) {
        router.push(`/universidade/curso/${courseId}/aprender`);
        return;
      }
      const result = await startCourseAction(courseId);
      if (result.success) {
        router.push(`/universidade/curso/${courseId}/aprender`);
      }
    });
  }

  const label = hasEnrollment
    ? progress > 0
      ? "Continuar curso"
      : "Acessar curso"
    : "Começar curso";

  return (
    <Button className="w-full" onClick={handleStart} disabled={pending}>
      {pending ? "Carregando..." : label}
    </Button>
  );
}
