"use client";

import { useState } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { platformRoutes } from "@/lib/routes";
import type { SessionContext } from "@/modules/core/auth/session";

const TABS = [
  "Dados pessoais",
  "Organização",
  "Função e acessos",
  "Minha aprendizagem",
  "Meus certificados",
  "Gamificação",
  "Segurança",
] as const;

type Tab = (typeof TABS)[number];

type Cert = {
  id: string;
  validation_code: string;
  course_title_snapshot: string;
  instructor_name_snapshot: string;
  issued_at: string;
  status: string;
  is_demo: boolean;
};

type Enrollment = {
  id: string;
  course_id: string;
  progress_percentage: number;
  status: string;
  course_versions: { title: string } | { title: string }[] | null;
};

export function ProfileClient({
  session,
  enrollments,
  certificates,
}: {
  session: SessionContext;
  enrollments: Enrollment[];
  certificates: Cert[];
}) {
  const [tab, setTab] = useState<Tab>("Dados pessoais");

  return (
    <div className="space-y-8">
      <PageHeader title="Perfil" subtitle="Suas informações, aprendizagem e acessos." backHref={platformRoutes.home} />

      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === t
                ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                : "text-[var(--foreground-muted)] hover:bg-[var(--card)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Dados pessoais" && (
        <Card>
          <CardContent className="space-y-3 p-6 text-sm">
            <p>
              <span className="text-[var(--foreground-muted)]">Nome:</span> {session.fullName ?? "—"}
            </p>
            <p>
              <span className="text-[var(--foreground-muted)]">E-mail:</span> {session.email}
            </p>
          </CardContent>
        </Card>
      )}

      {tab === "Organização" && (
        <Card>
          <CardContent className="space-y-3 p-6 text-sm">
            <p>
              <span className="text-[var(--foreground-muted)]">Organização:</span> {session.tenantName}
            </p>
            <p>
              <span className="text-[var(--foreground-muted)]">Status:</span> {session.membershipStatus}
            </p>
          </CardContent>
        </Card>
      )}

      {tab === "Função e acessos" && (
        <Card>
          <CardContent className="space-y-3 p-6 text-sm">
            <p>
              <span className="text-[var(--foreground-muted)]">Papéis:</span>{" "}
              {session.roleCodes.join(", ") || "—"}
            </p>
            <p>
              <span className="text-[var(--foreground-muted)]">Permissões efetivas:</span>{" "}
              {session.permissions.length} liberadas
            </p>
          </CardContent>
        </Card>
      )}

      {tab === "Minha aprendizagem" && (
        <div className="space-y-4">
          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-[var(--foreground-muted)]">
                Nenhum curso matriculado.
              </CardContent>
            </Card>
          ) : (
            enrollments.map((e) => {
              const version = Array.isArray(e.course_versions) ? e.course_versions[0] : e.course_versions;
              return (
                <Card key={e.id}>
                  <CardContent className="space-y-2 p-6 text-sm">
                    <p className="font-medium">{version?.title ?? "Curso"}</p>
                    <p className="text-[var(--foreground-muted)]">
                      Progresso: {e.progress_percentage}% · Status: {e.status}
                    </p>
                    <p className="text-xs text-amber-400/90">
                      Vídeos das aulas principais: em preparação (homologação staging)
                    </p>
                    <a
                      href={platformRoutes.learning.learn(e.course_id)}
                      className="text-[var(--primary)] hover:underline"
                    >
                      Continuar
                    </a>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {tab === "Meus certificados" && (
        <div className="space-y-4">
          {certificates.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-[var(--foreground-muted)]">
                Nenhum certificado emitido.
              </CardContent>
            </Card>
          ) : (
            certificates.map((c) => (
              <Card key={c.id}>
                <CardContent className="space-y-2 p-6 text-sm">
                  <p className="font-medium">{c.course_title_snapshot}</p>
                  <p>Professor: {c.instructor_name_snapshot}</p>
                  <p className="font-mono text-xs text-[var(--primary)]">{c.validation_code}</p>
                  {c.is_demo && (
                    <p className="text-xs text-amber-400">Certificado de homologação (QA)</p>
                  )}
                  <a
                    href={`${platformRoutes.certificateValidation}?codigo=${encodeURIComponent(c.validation_code)}`}
                    className="text-[var(--primary)] hover:underline"
                  >
                    Validar publicamente
                  </a>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "Gamificação" && (
        <Card>
          <CardContent className="p-6 text-sm">
            <a href={platformRoutes.gamification.root} className="text-[var(--primary)] hover:underline">
              Acessar Gamificação — Rota do Fechamento
            </a>
          </CardContent>
        </Card>
      )}

      {tab === "Segurança" && (
        <Card>
          <CardContent className="p-6 text-sm text-[var(--foreground-muted)]">
            Para alterar senha ou sessões, utilize o fluxo de recuperação de acesso da organização.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
