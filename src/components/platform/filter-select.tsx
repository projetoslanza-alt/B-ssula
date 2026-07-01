import * as React from "react";
import { cn } from "@/lib/utils";

/** Select compacto para barras de filtro — alinhado ao Dark Executive (max ~220px). */
export const FilterSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-[42px] w-auto min-w-[140px] max-w-[220px] shrink-0 rounded-[11px]",
      "border border-[var(--border)] bg-[#0b121c] px-3 text-sm text-[var(--foreground)]",
      "focus-visible:outline-none focus-visible:border-[var(--primary)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary)]/10",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
FilterSelect.displayName = "FilterSelect";
