"use client";

import Link from "next/link";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { StatusBadge } from "@/components/platform/status-badge";
import { DeTabPanel, DeTabs } from "@/components/platform/de-tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/states";
import { platformRoutes } from "@/lib/routes";
import { ArrowRight, GraduationCap } from "lucide-react";
import { LEARNING_TABS, type LearningTabId } from "@/modules/learning/tabs";
import type { CatalogCourse } from "@/modules/learning/queries/catalog";

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type PathRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  workload_minutes: number | null;
};

type EnrollmentContinue = {
  id: string;
  status: string;
  progress_percentage: number | null;
  course_versions: { title: string } | { title: string }[] | null;
  courses: { slug: string } | { slug: string }[] | null;
};

type LearningHubProps = {
  activeTab: LearningTabId;
  stats: { inProgress: number; completed: number; overdue: number };
  hoursStudied: number;
  catalog: CatalogCourse[];
  paths: PathRow[];
  continueStudying: EnrollmentContinue[];
  assessmentsHref: string;
  assessmentsLabel: string;
};

function courseTitle(enrollment: EnrollmentContinue) {
  const version = unwrapOne(enrollment.course_versions);
  return version?.title ?? "Curso";
}

function courseSlug(enrollment: EnrollmentContinue) {
  const course = unwrapOne(enrollment.courses);
  return course?.slug;
}

export function LearningHub({
  activeTab,
  stats,
  hoursStudied,
  catalog,
  paths,
  continueStudying,
  assessmentsHref,
  assessmentsLabel,
}: LearningHubProps) {
  const mandatory = catalog.filter((c) => c.mandatory);

  return (
    <div className="space-y-8">
      <PageHeader
        subtitle="Conhecimento para avançar na direção certa."
        title="Universidade"
        description="Aprenda no seu ritmo, desenvolva competências e aplique o conhecimento na sua rotina."
      />

      <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[var(--card)] to-violet-950/20 p-8">
        <div className="flex items-start gap-4">
          <GraduationCap className="h-10 w-10 text-violet-400" />
          <div>
            <h2 className="text-xl font-semibold">Continue encontrando novos caminhos</h2>
            <p className="mt-1 text-[var(--foreground-muted)]">
              Aprenda no seu ritmo, desenvolva competências e aplique o conhecimento na sua rotina.
            </p>
          </div>
        </div>
      </section>

      <DeTabs tabs={[...LEARNING_TABS]} activeTab={activeTab} basePath={platformRoutes.learning.root} />

      <DeTabPanel id="inicio" activeTab={activeTab}>
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Cursos em andamento" value={stats.inProgress} variant="purple" />
            <MetricCard label="Concluídos" value={stats.completed} variant="success" />
            <MetricCard
              label="Obrigatórios pendentes"
              value={mandatory.filter((c) => (c.progressPercentage ?? 0) < 100).length}
              variant="warning"
            />
            <MetricCard label="Horas estudadas" value={`${hoursStudied}h`} variant="info" />
          </section>
          <section>
            <h3 className="mb-3 font-medium">Continue de onde parou</h3>
            {continueStudying.length === 0 ? (
              <EmptyState title="Nenhum curso em andamento" description="Explore o catálogo para iniciar." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {continueStudying.map((e) => {
                  const slug = courseSlug(e);
                  const pct = e.progress_percentage ?? 0;
                  return (
                    <Card key={e.id}>
                      <CardContent className="p-4">
                        <h4 className="font-medium">{courseTitle(e)}</h4>
                        <div className="mt-2 h-2 rounded-full bg-[var(--card-elevated)]">
                          <div className="h-2 rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-[var(--foreground-muted)]">{pct}% concluído</p>
                        {slug && (
                          <Button variant="link" className="mt-2 h-auto p-0" asChild>
                            <Link href={platformRoutes.learning.catalogCourse(slug)}>Continuar</Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </DeTabPanel>

      <DeTabPanel id="cursos" activeTab={activeTab}>
        {catalog.length === 0 ? (
          <EmptyState title="Nenhum curso disponível" description="Cursos publicados aparecerão aqui." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {catalog.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{c.title}</h4>
                    <StatusBadge
                      label={c.enrollmentStatus?.replace(/_/g, " ") ?? "disponível"}
                      tone={c.enrollmentStatus === "completed" ? "success" : "info"}
                    />
                  </div>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    {c.categoryName ?? "Curso"} · {Math.round(c.workloadMinutes / 60)}h
                  </p>
                  <Button variant="link" className="mt-2 h-auto p-0" asChild>
                    <Link href={platformRoutes.learning.catalogCourse(c.slug)}>Acessar</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DeTabPanel>

      <DeTabPanel id="trilhas" activeTab={activeTab}>
        {paths.length === 0 ? (
          <EmptyState title="Nenhuma trilha" description="Trilhas publicadas aparecerão aqui." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {paths.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-5">
                  <h4 className="font-medium">{p.title}</h4>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    {p.workload_minutes ? `${Math.round(p.workload_minutes / 60)}h` : "—"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DeTabPanel>

      <DeTabPanel id="aulas" activeTab={activeTab}>
        <Card className="border-[var(--border)] bg-[var(--panel)]">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm text-[var(--muted)]">Explore o catálogo para acessar aulas e matrículas.</p>
            <Button asChild>
              <Link href={platformRoutes.learning.catalog}>
                Abrir catálogo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </DeTabPanel>

      <DeTabPanel id="avaliacoes" activeTab={activeTab}>
        <Card className="border-[var(--border)] bg-[var(--panel)]">
          <CardContent className="space-y-3 p-5">
            <p className="font-medium">Contorno de Objeções — Avaliação final</p>
            <p className="text-sm text-[var(--foreground-muted)]">
              Disponível após conclusão das aulas · Nota mínima: 7.0
            </p>
            <Button asChild>
              <Link href={assessmentsHref}>{assessmentsLabel}</Link>
            </Button>
          </CardContent>
        </Card>
      </DeTabPanel>

      <DeTabPanel id="certificados" activeTab={activeTab}>
        <Card className="border-[var(--border)] bg-[var(--panel)]">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm text-[var(--muted)]">Consulte certificados emitidos e códigos de validação.</p>
            <Button asChild>
              <Link href={platformRoutes.learning.certificates}>Ver certificados</Link>
            </Button>
          </CardContent>
        </Card>
      </DeTabPanel>

      <DeTabPanel id="progresso" activeTab={activeTab}>
        <Card className="border-[var(--border)] bg-[var(--panel)]">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm text-[var(--muted)]">
              Horas estudadas: {hoursStudied}h · Em andamento: {stats.inProgress} · Concluídos: {stats.completed}
            </p>
            <Button asChild>
              <Link href={platformRoutes.learning.progress}>Detalhar progresso</Link>
            </Button>
          </CardContent>
        </Card>
      </DeTabPanel>
    </div>
  );
}
