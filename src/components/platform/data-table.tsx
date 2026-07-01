import { cn } from "@/lib/utils";

type DataTableProps = {
  columns: { key: string; label: string; className?: string }[];
  children: React.ReactNode;
  className?: string;
};

export function DataTable({ columns, children, className }: DataTableProps) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--panel)]", className)}>
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-[var(--border)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-secondary)]",
                  col.className,
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function DataTableRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("border-b border-[var(--border)] last:border-0 hover:bg-[var(--panel-secondary)]/60", className)}>
      {children}
    </tr>
  );
}

export function DataTableCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3 align-middle text-[var(--foreground)]", className)}>{children}</td>;
}
