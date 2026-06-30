import Link from "next/link";
import { Clock, Globe2, BookOpen, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COURSE_LEVEL_LABELS, ENROLLMENT_STATUS_LABELS, type EnrollmentStatus } from "@/modules/learning/domain/progress";
import { formatPercent, cn } from "@/lib/utils";

export type CourseCardProps = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  coverUrl?: string | null;
  level: string;
  workloadMinutes: number;
  isGlobal?: boolean;
  categoryName?: string | null;
  progressPercentage?: number | null;
  enrollmentStatus?: string | null;
  mandatory?: boolean;
  dueAt?: string | null;
};

export function CourseCard({
  slug,
  title,
  shortDescription,
  coverUrl,
  level,
  workloadMinutes,
  isGlobal,
  categoryName,
  progressPercentage,
  enrollmentStatus,
  mandatory,
  dueAt,
}: CourseCardProps) {
  const hasProgress = progressPercentage != null && progressPercentage > 0;
  const isOverdue = enrollmentStatus === "overdue";

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-10 w-10 text-slate-300" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {isGlobal && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              <Globe2 className="h-3 w-3" /> Bússola
            </span>
          )}
          {mandatory && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
              Obrigatório
            </span>
          )}
        </div>
      </div>
      <CardHeader className="pb-2">
        {categoryName && (
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {categoryName}
          </p>
        )}
        <CardTitle className="line-clamp-2 text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-3">
        {shortDescription && (
          <p className="line-clamp-2 text-sm text-slate-500">{shortDescription}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>{COURSE_LEVEL_LABELS[level] ?? level}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {Math.round(workloadMinutes / 60)}h
          </span>
        </div>
        {hasProgress && (
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span>Progresso</span>
              <span>{formatPercent(progressPercentage)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
        {isOverdue && dueAt && (
          <p className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            Prazo encerrado — {ENROLLMENT_STATUS_LABELS[enrollmentStatus as EnrollmentStatus]}
          </p>
        )}
        <div className="flex gap-2">
          <Link
            href={`/universidade/catalogo/${slug}`}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {hasProgress ? "Continuar curso" : "Ver detalhes"}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCard({
  label,
  value,
  description,
  variant = "default",
}: {
  label: string;
  value: string | number;
  description?: string;
  variant?: "default" | "warning" | "success";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-slate-500">{label}</p>
        <p
          className={cn(
            "mt-1 text-2xl font-semibold",
            variant === "warning" && "text-amber-600",
            variant === "success" && "text-emerald-600",
          )}
        >
          {value}
        </p>
        {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      </CardContent>
    </Card>
  );
}
