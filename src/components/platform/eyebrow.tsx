import { cn } from "@/lib/utils";

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--primary)] sm:text-[11px]",
        className,
      )}
    >
      <span className="mr-2 text-[var(--muted-secondary)]">—</span>
      {children}
    </p>
  );
}
