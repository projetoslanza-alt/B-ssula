"use client";

import { Film, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LearningContentPending({
  title = "Vídeo em preparação",
  message,
  isDemoNote,
}: {
  title?: string;
  message: string;
  isDemoNote?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] p-6">
      <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background-secondary)] p-8 text-center">
        <Film className="h-12 w-12 text-[var(--foreground-muted)]" aria-hidden />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
          <p className="max-w-md text-sm text-[var(--foreground-muted)]">{message}</p>
          {isDemoNote && (
            <p className="flex items-center justify-center gap-1 text-xs text-[var(--accent-orange)]">
              <Info className="h-3.5 w-3.5" />
              {isDemoNote}
            </p>
          )}
        </div>
        <Button type="button" disabled className="mt-2" title="O vídeo ainda não está disponível">
          Reproduzir vídeo
        </Button>
      </div>
    </div>
  );
}
