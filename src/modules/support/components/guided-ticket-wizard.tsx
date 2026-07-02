"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  BarChart3,
  GraduationCap,
  HelpCircle,
  Phone,
  Sparkles,
  Target,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { platformRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { createTicketAction } from "@/modules/support/actions/ticket-actions";
import { computeSuggestedPriority, type ImpactData } from "@/modules/support/domain/intake-priority";

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

type WizardProps = {
  categories: CategoryRow[];
  permissions: string[];
};

export function GuidedTicketWizard({ categories, permissions }: WizardProps) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [impact, setImpact] = useState<ImpactData>({});
  const [evidenceNote, setEvidenceNote] = useState("");

  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (c) => !c.required_permission || permissions.includes(c.required_permission),
      ),
    [categories, permissions],
  );

  const category = visibleCategories.find((c) => c.id === categoryId);
  const subcategories = (category?.support_subcategories ?? []).filter((s) => s.is_active);
  const suggestedPriority = computeSuggestedPriority(impact);

  function setAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set("title", answers.title ?? "");
    fd.set("description", answers.description ?? "");
    fd.set("categoryId", categoryId);
    fd.set("subcategoryId", subcategoryId);
    fd.set("priority", suggestedPriority);
    fd.set("impactJson", JSON.stringify(impact));
    fd.set("answersJson", JSON.stringify({ ...answers, evidence: evidenceNote }));
    startTransition(async () => {
      try {
        await createTicketAction(fd);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível enviar o chamado.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "rounded-lg border px-2 py-2 text-center text-xs",
              i === step
                ? "border-sky-500/50 bg-sky-500/10 text-sky-400"
                : i < step
                  ? "border-emerald-500/30 text-emerald-400"
                  : "border-[var(--border)] text-[var(--muted)]",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Em qual área você precisa de orientação ou suporte?</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {visibleCategories.map((cat) => {
              const Icon = ICONS[cat.icon ?? ""] ?? HelpCircle;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(cat.id);
                    setSubcategoryId("");
                  }}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    categoryId === cat.id
                      ? "border-sky-500/50 bg-sky-500/10"
                      : "border-[var(--border)] hover:border-sky-500/30",
                  )}
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
          <CardHeader>
            <CardTitle>Qual opção representa melhor a sua necessidade?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {subcategories.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSubcategoryId(sub.id)}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-left",
                  subcategoryId === sub.id ? "border-sky-500/50 bg-sky-500/10" : "border-[var(--border)]",
                )}
              >
                {sub.name}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Contexto da solicitação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Título curto" value={answers.title ?? ""} onChange={(e) => setAnswer("title", e.target.value)} />
            <Textarea placeholder="Descreva o que aconteceu" value={answers.description ?? ""} onChange={(e) => setAnswer("description", e.target.value)} rows={4} />
            <Input placeholder="Onde acontece?" value={answers.where ?? ""} onChange={(e) => setAnswer("where", e.target.value)} />
            <Input type="date" value={answers.when_started ?? ""} onChange={(e) => setAnswer("when_started", e.target.value)} />
            <Textarea placeholder="O que você esperava?" value={answers.expected ?? ""} onChange={(e) => setAnswer("expected", e.target.value)} />
            <Textarea placeholder="O que aconteceu de fato?" value={answers.actual ?? ""} onChange={(e) => setAnswer("actual", e.target.value)} />
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Impacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={impact.whoImpacted ?? ""} onChange={(e) => setImpact((p) => ({ ...p, whoImpacted: e.target.value }))}>
              <option value="">Quem está sendo impactado?</option>
              <option value="only_me">Somente eu</option>
              <option value="some_people">Algumas pessoas</option>
              <option value="one_team">Uma equipe</option>
              <option value="many_teams">Várias equipes</option>
              <option value="whole_company">Toda a empresa</option>
            </Select>
            <Select value={impact.activityBlocked ?? ""} onChange={(e) => setImpact((p) => ({ ...p, activityBlocked: e.target.value }))}>
              <option value="">A atividade está impedida?</option>
              <option value="no">Não</option>
              <option value="partial">Parcialmente</option>
              <option value="total">Totalmente</option>
            </Select>
            <Select value={impact.mainImpact ?? ""} onChange={(e) => setImpact((p) => ({ ...p, mainImpact: e.target.value }))}>
              <option value="">Impacto principal</option>
              <option value="productivity">Produtividade</option>
              <option value="sales">Venda</option>
              <option value="access">Acesso</option>
              <option value="data">Dados</option>
              <option value="operation">Operação</option>
            </Select>
            {suggestedPriority === "urgent" && (
              <Textarea
                placeholder="Justificativa para prioridade crítica (se aplicável)"
                value={impact.criticalJustification ?? ""}
                onChange={(e) => setImpact((p) => ({ ...p, criticalJustification: e.target.value }))}
              />
            )}
            <p className="text-sm text-[var(--muted)]">
              Prioridade sugerida: <strong className="text-[var(--foreground)]">{suggestedPriority}</strong>
            </p>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Evidências</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Links, mensagens de erro, protocolos relacionados..."
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              rows={5}
            />
            <p className="text-xs text-[var(--muted)]">Anexos de arquivo podem ser adicionados após a abertura do chamado.</p>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Encaminhamento previsto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Área: <strong>{category?.name}</strong></p>
            <p>Fila prevista: <strong>{category?.default_queue_slug ?? "triagem"}</strong></p>
            <p>Prioridade sugerida: <strong>{suggestedPriority}</strong></p>
          </CardContent>
        </Card>
      )}

      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle>Revisão e confirmação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Título:</strong> {answers.title}</p>
            <p><strong>Área:</strong> {category?.name}</p>
            <p><strong>Motivo:</strong> {subcategories.find((s) => s.id === subcategoryId)?.name}</p>
            <p><strong>Prioridade:</strong> {suggestedPriority}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Link href={platformRoutes.support.root} className="btn btn-ghost btn-sm">
          Cancelar
        </Link>
        <div className="flex gap-2">
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Voltar
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={
                (step === 0 && !categoryId) ||
                (step === 1 && !subcategoryId) ||
                (step === 2 && (!answers.title || !answers.description))
              }
            >
              Avançar
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={pending}>
              {pending ? "Enviando..." : "Confirmar e abrir chamado"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
