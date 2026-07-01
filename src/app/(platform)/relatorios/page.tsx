"use client";

import Link from "next/link";
import { useState } from "react";
import { DemoBanner } from "@/components/platform/demo-banner";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterBar } from "@/components/platform/filter-bar";
import { FilterSelect } from "@/components/platform/filter-select";
import { DEMO_REPORTS } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { Star } from "lucide-react";

export default function RelatoriosPage() {
  const [filter, setFilter] = useState("todos");
  const reports = filter === "todos" ? DEMO_REPORTS : DEMO_REPORTS.filter((r) => r.type === filter);

  return (
    <div className="space-y-8">
      <DemoBanner />
      <PageHeader
        subtitle="Transforme os dados da operação em análises sob medida."
        title="Relatórios"
        description="Construtor visual no-code para criar relatórios personalizados."
        actions={
          <Button asChild>
            <Link href={platformRoutes.reports.new}>+ Criar relatório</Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Meus relatórios" value={1} />
        <MetricCard label="Compartilhados" value={1} variant="info" />
        <MetricCard label="Modelos" value={3} variant="purple" />
      </section>

      <FilterBar className="max-w-xl">
        <FilterSelect value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Tipo">
          <option value="todos">Todos</option>
          <option value="modelo">Modelos</option>
          <option value="personalizado">Personalizados</option>
        </FilterSelect>
      </FilterBar>

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((r) => (
          <Link key={r.id} href={platformRoutes.reports.report(r.id)}>
            <Card className="h-full hover:border-sky-500/30">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium">{r.name}</h3>
                  {r.favorite && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                </div>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">{r.description}</p>
                <p className="mt-2 text-xs text-[var(--foreground-disabled)]">{r.module} · {r.author}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
