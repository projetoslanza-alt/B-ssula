"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { StatusBadge } from "@/components/platform/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEMO_COURSES, DEMO_PATHS } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { ArrowRight, GraduationCap } from "lucide-react";

export function LearningHub() {
  const [tab, setTab] = useState("inicio");

  const inProgress = DEMO_COURSES.filter((c) => c.status === "em_andamento");
  const completed = DEMO_COURSES.filter((c) => c.status === "concluido");
  const mandatory = DEMO_COURSES.filter((c) => c.mandatory);

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

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="inicio">Início</TabsTrigger>
          <TabsTrigger value="cursos">Meus cursos</TabsTrigger>
          <TabsTrigger value="trilhas">Trilhas</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
          <TabsTrigger value="certificados">Certificados</TabsTrigger>
          <TabsTrigger value="progresso">Meu progresso</TabsTrigger>
        </TabsList>

        <TabsContent value="inicio">
          <div className="mt-6 space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Cursos em andamento" value={inProgress.length} variant="purple" />
              <MetricCard label="Concluídos" value={completed.length} variant="success" />
              <MetricCard label="Obrigatórios pendentes" value={mandatory.filter((c) => c.progress < 100).length} variant="warning" />
              <MetricCard label="Horas estudadas" value="18h" variant="info" />
            </section>
            <section>
              <h3 className="mb-3 font-medium">Continue de onde parou</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {inProgress.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="p-4">
                      <h4 className="font-medium">{c.title}</h4>
                      <div className="mt-2 h-2 rounded-full bg-[var(--card-elevated)]">
                        <div className="h-2 rounded-full bg-violet-500" style={{ width: `${c.progress}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-[var(--foreground-muted)]">{c.progress}% concluído</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="cursos">
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {DEMO_COURSES.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{c.title}</h4>
                    <StatusBadge label={c.status.replace(/_/g, " ")} tone={c.status === "concluido" ? "success" : "info"} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{c.instructor} · {c.workloadHours}h</p>
                  <Button variant="link" className="mt-2 h-auto p-0" asChild>
                    <Link href={platformRoutes.learning.catalog}>Acessar</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trilhas">
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {DEMO_PATHS.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-5">
                  <h4 className="font-medium">{p.title}</h4>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{p.courses} cursos · {p.workloadHours}h</p>
                  <div className="mt-3 h-2 rounded-full bg-[var(--card-elevated)]">
                    <div className="h-2 rounded-full bg-violet-500" style={{ width: `${p.progress}%` }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="catalogo">
          <div className="mt-6">
            <Button asChild>
              <Link href={platformRoutes.learning.catalog}>Ver catálogo completo <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="avaliacoes">
          <div className="mt-6">
            <Button variant="outline" asChild>
              <Link href={platformRoutes.learning.assessments}>Ver avaliações</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="certificados">
          <div className="mt-6">
            <Button asChild>
              <Link href={platformRoutes.learning.certificates}>Ver certificados</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="progresso">
          <div className="mt-6">
            <Button asChild>
              <Link href={platformRoutes.learning.progress}>Minha jornada de aprendizado</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
