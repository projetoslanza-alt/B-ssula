"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/platform/page-header";
import { ConfirmModal } from "@/components/platform/confirm-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { platformRoutes } from "@/lib/routes";
import {
  changeProfilePasswordAction,
  updateProfilePersonalAction,
} from "@/modules/profile/actions/profile-actions";
import type { SessionContext } from "@/modules/core/auth/session";
import type { JourneySummary } from "@/modules/gamification/domain/types";

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
  phone,
  jobTitle,
  localAuth,
  enrollments,
  certificates,
  journey,
}: {
  session: SessionContext;
  phone: string;
  jobTitle: string;
  localAuth: boolean;
  enrollments: Enrollment[];
  certificates: Cert[];
  journey: JourneySummary;
}) {
  const [tab, setTab] = useState<Tab>("Dados pessoais");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profilePending, startProfileTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();

  const [confirmProfileOpen, setConfirmProfileOpen] = useState(false);
  const [confirmPasswordOpen, setConfirmPasswordOpen] = useState(false);

  const profileFormRef = useRef<HTMLFormElement>(null);
  const passwordFormRef = useRef<HTMLFormElement>(null);

  function submitProfile() {
    const form = profileFormRef.current;
    if (!form) return;
    const formData = new FormData(form);
    startProfileTransition(async () => {
      setProfileError(null);
      setProfileSuccess(false);
      const result = await updateProfilePersonalAction(formData);
      setConfirmProfileOpen(false);
      if (!result.ok) {
        setProfileError(result.error);
        return;
      }
      setProfileSuccess(true);
    });
  }

  function submitPassword() {
    const form = passwordFormRef.current;
    if (!form) return;
    const formData = new FormData(form);
    startPasswordTransition(async () => {
      setPasswordError(null);
      setPasswordSuccess(false);
      const result = await changeProfilePasswordAction(formData);
      setConfirmPasswordOpen(false);
      if (!result.ok) {
        setPasswordError(result.error);
        return;
      }
      setPasswordSuccess(true);
      form.reset();
    });
  }

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
          <CardContent className="space-y-4 p-6 text-sm">
            <form
              ref={profileFormRef}
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setConfirmProfileOpen(true);
              }}
            >
              <label className="block space-y-1">
                <span className="text-[var(--foreground-muted)]">Nome</span>
                <Input name="fullName" defaultValue={session.fullName ?? ""} required />
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--foreground-muted)]">E-mail</span>
                <Input value={session.email} readOnly disabled aria-readonly />
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--foreground-muted)]">Telefone</span>
                <Input name="phone" defaultValue={phone} placeholder="Opcional" />
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--foreground-muted)]">Cargo</span>
                <Input name="jobTitle" defaultValue={jobTitle} placeholder="Opcional" />
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--foreground-muted)]">Motivo da alteração</span>
                <Input name="reason" required minLength={3} placeholder="Ex.: atualização cadastral" />
              </label>
              {profileError ? (
                <p className="text-red-400" role="alert">
                  {profileError}
                </p>
              ) : null}
              {profileSuccess ? (
                <p className="text-emerald-400" role="status">
                  Perfil atualizado com sucesso.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={profilePending}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {profilePending ? "Salvando..." : "Salvar dados pessoais"}
                </button>
                <Link
                  href={platformRoutes.home}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--card-elevated)]"
                >
                  Cancelar
                </Link>
              </div>
            </form>
            <p className="text-xs text-[var(--foreground-muted)]">
              Grupo, tenant, permissões, equipe, pontos e certificados não podem ser alterados nesta tela.
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
          <CardContent className="space-y-3 p-6 text-sm">
            <p>
              <span className="text-[var(--foreground-muted)]">Pontos totais:</span>{" "}
              {journey.totalPoints.toLocaleString("pt-BR")}
            </p>
            <p>
              <span className="text-[var(--foreground-muted)]">Campanhas:</span> {journey.campaignsParticipated}
            </p>
            <p>
              <span className="text-[var(--foreground-muted)]">Medalhas:</span> {journey.medals}
            </p>
            <a href={platformRoutes.gamification.root} className="text-[var(--primary)] hover:underline">
              Acessar Gamificação
            </a>
          </CardContent>
        </Card>
      )}

      {tab === "Segurança" && (
        <Card>
          <CardContent className="space-y-4 p-6 text-sm">
            {localAuth ? (
              <>
                <p className="text-[var(--foreground-muted)]">
                  Altere sua senha informando a senha atual. A sessão permanece ativa após a troca.
                </p>
                <form
                  ref={passwordFormRef}
                  className="max-w-md space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setConfirmPasswordOpen(true);
                  }}
                >
                  <label className="block space-y-1">
                    <span className="text-[var(--foreground-muted)]">Senha atual</span>
                    <Input
                      name="currentPassword"
                      type="password"
                      required
                      autoComplete="current-password"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[var(--foreground-muted)]">Nova senha</span>
                    <Input
                      name="newPassword"
                      type="password"
                      required
                      minLength={12}
                      autoComplete="new-password"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[var(--foreground-muted)]">Confirmar nova senha</span>
                    <Input
                      name="confirmPassword"
                      type="password"
                      required
                      minLength={12}
                      autoComplete="new-password"
                    />
                  </label>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Mínimo 12 caracteres, com maiúsculas, minúsculas e números.
                  </p>
                  {passwordError ? (
                    <p className="text-red-400" role="alert">
                      {passwordError}
                    </p>
                  ) : null}
                  {passwordSuccess ? (
                    <p className="text-emerald-400" role="status">
                      Senha alterada com sucesso.
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={passwordPending}
                    className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {passwordPending ? "Alterando..." : "Alterar senha"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <p className="text-[var(--foreground-muted)]">
                  Para alterar a senha, utilize o fluxo seguro de recuperação de acesso.
                </p>
                <a href="/esqueci-minha-senha" className="text-[var(--primary)] hover:underline">
                  Solicitar redefinição de senha
                </a>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmModal
        open={confirmProfileOpen}
        title="Confirmar alterações"
        message="Deseja salvar as alterações no seu perfil?"
        confirmLabel="Confirmar alterações"
        loading={profilePending}
        onCancel={() => setConfirmProfileOpen(false)}
        onConfirm={submitProfile}
      />

      <ConfirmModal
        open={confirmPasswordOpen}
        title="Confirmar troca de senha"
        message="Tem certeza que deseja alterar sua senha?"
        confirmLabel="Confirmar troca de senha"
        loading={passwordPending}
        onCancel={() => setConfirmPasswordOpen(false)}
        onConfirm={submitPassword}
      />
    </div>
  );
}
