import { Info } from "lucide-react";

type DemoBannerProps = {
  message?: string;
};

export function DemoBanner({
  message = "Visualização de homologação — dados demonstrativos que não persistem após recarregar.",
}: DemoBannerProps) {
  return (
    <div
      className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
      role="status"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
