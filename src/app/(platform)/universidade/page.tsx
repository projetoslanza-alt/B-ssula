import { redirect } from "next/navigation";
import { getSessionContext } from "@/modules/core/auth/session";
import { PlatformShell } from "@/components/layout/platform-shell";
import { getUniversityHomeData } from "@/modules/learning/queries/catalog";
import { CourseCard, StatCard } from "@/modules/learning/components/course-card";
import { EmptyState } from "@/components/feedback/states";
import Link from "next/link";
import { unwrapRelation } from "@/lib/supabase/relations";
import { Compass, ArrowRight } from "lucide-react";

export default async function UniversidadeHomePage() {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  const home = await getUniversityHomeData(session);
  const greeting = getGreeting();
  const firstName = session.fullName?.split(" ")[0] ?? "colaborador";

  return (
    <PlatformShell
      organizationName={session.tenantName}
      userName={session.fullName ?? session.email}
      currentPath="/universidade"
      showManagerNav={session.permissions.includes("learning.team.read")}
      showAdminNav={session.permissions.includes("learning.course.create")}
      organizations={session.organizations}
      activeTenantId={session.tenantId}
    >
      <div className="space-y-8">
        <section>
          <p className="text-sm text-slate-500">{greeting}</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Olá, {firstName}
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            O que você deseja aprender?
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Em andamento" value={home.stats.inProgress} />
          <StatCard label="Concluídos" value={home.stats.completed} variant="success" />
          <StatCard
            label="Obrigatórios pendentes"
            value={home.mandatory.length}
            variant={home.mandatory.length > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Atrasados"
            value={home.stats.overdue}
            variant={home.stats.overdue > 0 ? "warning" : "default"}
          />
        </section>

        {home.continueStudying.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Continuar de onde parei</h2>
              <Link href="/universidade/minha-universidade" className="text-sm text-amber-700 hover:underline">
                Ver tudo
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {home.continueStudying.map((item) => {
                const course = unwrapRelation(item.courses);
                const version = unwrapRelation(item.course_versions);
                return (
                  <CourseCard
                    key={item.id}
                    id={course?.id ?? item.id}
                    slug={course?.slug ?? ""}
                    title={version?.title ?? "Curso"}
                    coverUrl={version?.cover_url}
                    level="beginner"
                    workloadMinutes={60}
                    progressPercentage={item.progress_percentage}
                    enrollmentStatus={item.status}
                    mandatory={item.mandatory}
                    dueAt={item.due_at}
                  />
                );
              })}
            </div>
          </section>
        )}

        {home.mandatory.length > 0 && (
          <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Compass className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold">Treinamentos obrigatórios</h2>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Priorize estes conteúdos para manter sua rota em dia.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {home.mandatory.slice(0, 3).map((item) => {
                const course = unwrapRelation(item.courses);
                const version = unwrapRelation(item.course_versions);
                return (
                  <CourseCard
                    key={item.id}
                    id={course?.id ?? item.id}
                    slug={course?.slug ?? ""}
                    title={version?.title ?? "Curso"}
                    level="beginner"
                    workloadMinutes={60}
                    mandatory
                    enrollmentStatus={item.status}
                    dueAt={item.due_at}
                    progressPercentage={item.progress_percentage}
                  />
                );
              })}
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Novos cursos</h2>
            <Link
              href="/universidade/catalogo"
              className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-sm text-amber-700 hover:bg-amber-50"
            >
              Explorar catálogo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {home.newCourses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {home.newCourses.map((course) => (
                <CourseCard key={course.id} {...course} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum curso disponível ainda"
              description="Quando novos conteúdos forem publicados, eles aparecerão aqui."
              action={
                <Link
                  href="/universidade/catalogo"
                  className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Ir ao catálogo
                </Link>
              }
            />
          )}
        </section>
      </div>
    </PlatformShell>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
