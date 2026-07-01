import { cn } from "@/lib/utils";

type TimelineItem = {
  id: string;
  title: string;
  subtitle: string;
  tone?: "success" | "info" | "default";
};

const DOT_STYLES = {
  success: "bg-[var(--success)]",
  info: "bg-[var(--primary)]",
  default: "bg-[var(--muted-secondary)]",
};

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < items.length - 1 && (
            <span className="absolute left-[7px] top-4 h-[calc(100%-4px)] w-px bg-[var(--border)]" aria-hidden />
          )}
          <span
            className={cn("relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full", DOT_STYLES[item.tone ?? "default"])}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">{item.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
