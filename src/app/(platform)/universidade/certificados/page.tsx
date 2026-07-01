"use client";

import { useState } from "react";
import Link from "next/link";
import { DemoBanner } from "@/components/platform/demo-banner";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { DEMO_CERTIFICATES } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { Copy, Download, Share2 } from "lucide-react";

export default function CertificadosPage() {
  const [statusFilter, setStatusFilter] = useState("todos");
  const filtered = statusFilter === "todos"
    ? DEMO_CERTIFICATES
    : DEMO_CERTIFICATES.filter((c) => c.status === statusFilter);

  return (
    <div className="space-y-8">
      <DemoBanner message="Certificados demonstrativos de homologação." />
      <PageHeader
        subtitle="Reconhecimentos conquistados ao longo da sua jornada."
        title="Certificados"
        backHref={platformRoutes.learning.root}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total de certificados" value={DEMO_CERTIFICATES.length} variant="purple" />
        <MetricCard label="No mês" value={1} variant="success" />
        <MetricCard label="Carga horária certificada" value="14h" />
        <MetricCard label="Último certificado" value="Jun/2026" variant="info" />
      </section>

      <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs" aria-label="Status">
        <option value="todos">Todos os status</option>
        <option value="disponivel">Disponível</option>
        <option value="em_processamento">Em processamento</option>
      </Select>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((cert) => (
          <Card key={cert.id} className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-violet-500 to-sky-500" />
            <CardContent className="space-y-4 p-6">
              <div className="flex justify-between">
                <h3 className="font-semibold">{cert.courseName}</h3>
                <StatusBadge label={cert.status} tone="success" />
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">{cert.studentName}</p>
              <p className="text-sm">Conclusão: {cert.completedAt} · {cert.workloadHours}h · Nota {cert.grade}</p>
              <p className="font-mono text-xs text-sky-400">{cert.validationCode}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={platformRoutes.learning.certificate(cert.id)}>Visualizar</Link>
                </Button>
                <Button size="sm" variant="outline"><Download className="h-4 w-4" /> PDF</Button>
                <Button size="sm" variant="ghost"><Copy className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost"><Share2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
