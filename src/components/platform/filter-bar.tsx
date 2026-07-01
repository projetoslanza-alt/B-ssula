import { cn } from "@/lib/utils";

export function FilterBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
