import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  collapsed?: boolean;
  className?: string;
};

export function BrandLogo({ collapsed, className }: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400/20 to-blue-600/20 ring-1 ring-sky-400/30">
        <Compass className="h-5 w-5 text-sky-400" aria-hidden />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">Bússola</p>
          <p className="truncate text-[10px] text-[var(--foreground-muted)]">by VendasComCiência</p>
        </div>
      )}
    </div>
  );
}
