import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <Card className={cn("border-[var(--border)] bg-[var(--panel)]", className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="mb-4">
          <h3 className="text-base font-bold text-[var(--foreground)]">{title}</h3>
          {description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
