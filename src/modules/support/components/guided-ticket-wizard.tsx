"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  BarChart3,
  GraduationCap,
  HelpCircle,
  Loader2,
  Phone,
  Sparkles,
  Target,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { platformRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { createTicketAction } from "@/modules/support/actions/ticket-actions";
import { getIntakeQuestionsAction, type IntakeQuestion } from "@/modules/support/actions/intake-actions";
import { DynamicQuestionField } from "@/modules/support/components/dynamic-question-field";
import { computeSuggestedPriority, type ImpactData } from "@/modules/support/domain/intake-priority";
import { SUPPORT_UPLOAD_LIMITS } from "@/modules/core/files/support-upload";

const ICONS: Record<string, LucideIcon> = {
  Users,
  Phone,
  Workflow,
  BarChart3,
  Target,
  GraduationCap,
  Sparkles,
  HelpCircle,
};

const STEPS = ["Área", "Motivo", "Contexto", "Impacto", "Evidências", "Encaminhamento", "Revisão"];
const UNIVERSAL_KEYS = new Set(["title", "description", "where", "when_started", "expected", "actual", "tried", "recurrence"]);
const NONE_SUBCATEGORY = "__none__";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  required_permission: string | null;
  default_queue_slug: string | null;
  support_subcategories: { id: string; name: string; slug: string; is_active: boolean }[] | null;
};

type PendingAttachment = {
  path: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

function mapImpactAnswers(answers: Record<string, string>): ImpactData {
  const mapWho: Record<string, ImpactData["whoImpacted"]> = {
    "Somente eu": "only_me",
    "Algumas pessoas": "some_people",
    "Uma equipe": "one_team",
    "Várias equipes": "many_teams",
    "Toda a empresa": "whole_company",
  };
  const mapBlocked: Record<string, ImpactData["activityBlocked"]> = {
    Não: "no",
    Parcialmente: "partial",
    Totalmente: "total",
  };
  const mapMain: Record<string, ImpactData["mainImpact"]> = {
    Produtividade: "productivity",
    Atendimento: "service",
    Venda: "sales",
    Contrato: "contract",
    Dados: "data",
    Treinamento: "training",
    Acesso: "access",
    Operação: "operation",
    Outro: "other",
  };
  return {
    whoImpacted: mapWho[answers.who_impacted ?? ""] ?? answers.who_impacted,
    activityBlocked: mapBlocked[answers.activity_blocked ?? ""] ?? answers.activity_blocked,
    mainImpact: mapMain[answers.main_impact ?? ""] ?? answers.main_impact,
    deadlineAffected: {
      Hoje: "today",
      "Nas próximas 24 horas": "next_24h",
      "Nesta semana": "this_week",
      "Informar data": "custom",
      Não: "no",
    }[answers.deadline_impact ?? ""] ?? "no",
    hasWorkaround: answers.temporary_alternative === "Sim" ? "yes" : answers.temporary_alternative === "Não" ? "no" : undefined,
    criticalJustification: answers.critical_justification,
  };
}

export function GuidedTicketWizard({ categories, permissions }: { categories: CategoryRow[]; permissions: string[] }) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contextQuestions, setContextQuestions] = useState<IntakeQuestion[]>([]);
  const [impactQuestions, setImpactQuestions] = useState<IntakeQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [evidenceLink, setEvidenceLink] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const visibleCategories = useMemo(
    () => categories.filter((c) => !c.required_permission || permissions.includes(c.required_permission)),
    [categories, permissions],
  );

  const category = visibleCategories.find((c) => c.id === categoryId);
  const subcategories = (category?.support_subcategories ?? []).filter((s) => s.is_active);
  const effectiveSubcategoryId = subcategoryId === NONE_SUBCATEGORY ? null : subcategoryId || null;
  const impact = mapImpactAnswers(answers);
  const suggestedPriority = computeSuggestedPriority(impact);

  async function loadQuestionsForSelection() {
    if (!categoryId) return;
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const [ctx, imp] = await Promise.all([
        getIntakeQuestionsAction(categoryId, effectiveSubcategoryId, ["context", "category", "subcategory"]),
        getIntakeQuestionsAction(categoryId, effectiveSubcategoryId, ["impact"]),
      ]);
      setContextQuestions(ctx);
      setImpactQuestions(imp);
      setAnswers((prev) => {
        const next = { ...prev };
        const validKeys = new Set([...ctx, ...imp].map((q) => q.question_key));
        for (const key of Object.keys(next)) {
          if (!validKeys.has(key) && !UNIVERSAL_KEYS.has(key)) delete next[key];
        }
        return next;
      });
    } catch (e) {
      setQuestionsError(e instanceof Error ? e.message : "Erro ao carregar perguntas.");
    } finally {
      setQuestionsLoading(false);
    }
  }

  async function goNext() {
    if (step === 0 && categoryId && subcategories.length === 0) {
      setSubcategoryId(NONE_SUBCATEGORY);
    }
    if (step === 1) await loadQuestionsForSelection();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function setAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files?.length) return;
    if (attachments.length + files.length > SUPPORT_UPLOAD_LIMITS.maxFiles) {
      setError("Máximo de 5 anexos por chamado.");
      return;
    }
    setUploading(true);
    setUploadProgress("Enviando...");
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/support/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Falha no upload");
        setAttachments((prev) => [
          ...prev,
          { path: json.path, fileName: json.fileName, mimeType: json.mimeType, fileSize: json.fileSize },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set("title", answers.title ?? "");
    fd.set("description", answers.description ?? "");
    fd.set("categoryId", categoryId);
    fd.set("subcategoryId", effectiveSubcategoryId ?? "");
    fd.set("priority", suggestedPriority);
    fd.set("impactJson", JSON.stringify(impact));
    fd.set("answersJson", JSON.stringify({ ...answers, evidence_link: evidenceLink, error_message: errorMessage }));
    fd.set("attachmentsJson", JSON.stringify(attachments));
    startTransition(async () => {
      try {
        await createTicketAction(fd);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível enviar o chamado.");
      }
    });
  }

  const contextValid = contextQuestions
    .filter((q) => q.is_required)
    .every((q) => (answers[q.question_key] ?? "").trim().length > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "rounded-lg border px-2 py-2 text-center text-xs",
              i === step ? "border-sky-500/50 bg-sky-500/10 text-sky-400" : i < step ? "border-emerald-500/30 text-emerald-400" : "border-[var(--border)] text-[var(--muted)]",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Em qual área você precisa de orientação ou suporte?</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {visibleCategories.map((cat) => {
              const Icon = ICONS[cat.icon ?? ""] ?? HelpCircle;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setCategoryId(cat.id); setSubcategoryId(""); }}
                  className={cn("rounded-xl border p-4 text-left transition", categoryId === cat.id ? "border-sky-500/50 bg-sky-500/10" : "border-[var(--border)] hover:border-sky-500/30")}
                >
                  <Icon className="mb-2 h-5 w-5 text-sky-400" />
                  <p className="font-medium">{cat.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{cat.description}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Qual opção representa melhor a sua necessidade?</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {subcategories.length === 0 && (
              <p className="text-sm text-[var(--muted)]">Nenhuma subcategoria cadastrada para esta área.</p>
            )}
            {subcategories.map((sub) => (
              <button key={sub.id} type="button" onClick={() => setSubcategoryId(sub.id)} className={cn("w-full rounded-lg border px-4 py-3 text-left", subcategoryId === sub.id ? "border-sky-500/50 bg-sky-500/10" : "border-[var(--border)]")}>
                {sub.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSubcategoryId(
                subcategories.find((s) => s.slug.includes("nao-encontrei"))?.id
                  ?? (subcategories.length === 0 ? NONE_SUBCATEGORY : subcategories[subcategories.length - 1]?.id ?? NONE_SUBCATEGORY),
              )}
              className={cn(
                "w-full rounded-lg border border-dashed px-4 py-3 text-left text-sm text-[var(--muted)]",
                subcategoryId === NONE_SUBCATEGORY || subcategories.find((s) => s.id === subcategoryId)?.slug.includes("nao-encontrei") ? "border-sky-500/50 bg-sky-500/10" : "",
              )}
            >
              Não encontrei a opção correta
            </button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Contexto da solicitação</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {questionsLoading && (
              <p className="flex items-center gap-2 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Carregando perguntas...</p>
            )}
            {questionsError && <p className="text-sm text-red-400">{questionsError}</p>}
            {!questionsLoading && contextQuestions.map((q) => (
              <DynamicQuestionField key={q.id} question={q} value={answers[q.question_key] ?? ""} onChange={(v) => setAnswer(q.question_key, v)} />
            ))}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Impacto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {impactQuestions.map((q) => (
              <DynamicQuestionField key={q.id} question={q} value={answers[q.question_key] ?? ""} onChange={(v) => setAnswer(q.question_key, v)} />
            ))}
            {suggestedPriority === "urgent" && (
              <Textarea placeholder="Justificativa para prioridade crítica" value={answers.critical_justification ?? ""} onChange={(e) => setAnswer("critical_justification", e.target.value)} />
            )}
            <p className="text-sm text-[var(--muted)]">Prioridade sugerida: <strong className="text-[var(--foreground)]">{suggestedPriority}</strong></p>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>Evidências</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input type="url" placeholder="Link relacionado" value={evidenceLink} onChange={(e) => setEvidenceLink(e.target.value)} />
            <Textarea placeholder="Mensagem de erro ou protocolo relacionado" value={errorMessage} onChange={(e) => setErrorMessage(e.target.value)} rows={3} />
            <div>
              <label className="btn btn-outline btn-sm cursor-pointer">
                {uploading ? "Enviando..." : "Anexar arquivo"}
                <input type="file" className="hidden" multiple accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx" onChange={(e) => handleFileUpload(e.target.files)} disabled={uploading} />
              </label>
              {uploadProgress && <p className="mt-1 text-xs text-[var(--muted)]">{uploadProgress}</p>}
              <p className="mt-1 text-xs text-[var(--muted)]">Até {SUPPORT_UPLOAD_LIMITS.maxFiles} arquivos, 20 MB cada. Imagem, PDF, planilha ou texto.</p>
            </div>
            <ul className="space-y-2">
              {attachments.map((a) => (
                <li key={a.path} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                  <span>{a.fileName} ({Math.round(a.fileSize / 1024)} KB)</span>
                  <button type="button" onClick={() => setAttachments((prev) => prev.filter((x) => x.path !== a.path))} aria-label="Remover"><X className="h-4 w-4 text-red-400" /></button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader><CardTitle>Encaminhamento previsto</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Área: <strong>{category?.name}</strong></p>
            <p>Fila prevista: <strong>{category?.default_queue_slug ?? "triagem"}</strong></p>
            <p>Prioridade sugerida: <strong>{suggestedPriority}</strong></p>
            <p>Anexos: <strong>{attachments.length}</strong></p>
          </CardContent>
        </Card>
      )}

      {step === 6 && (
        <Card>
          <CardHeader><CardTitle>Revisão e confirmação</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Título:</strong> {answers.title}</p>
            <p><strong>Área:</strong> {category?.name}</p>
            <p><strong>Motivo:</strong> {subcategories.find((s) => s.id === subcategoryId)?.name}</p>
            <p><strong>Prioridade:</strong> {suggestedPriority}</p>
            <p><strong>Anexos:</strong> {attachments.length}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Link href={platformRoutes.support.root} className="btn btn-ghost btn-sm">Cancelar</Link>
        <div className="flex gap-2">
          {step > 0 && <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>Voltar</Button>}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => void goNext()} disabled={(step === 0 && !categoryId) || (step === 1 && !subcategoryId) || (step === 2 && !contextValid) || questionsLoading}>
              Avançar
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={pending}>{pending ? "Enviando..." : "Confirmar e abrir chamado"}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
