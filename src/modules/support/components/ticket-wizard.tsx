"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { platformRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { createTicketAction } from "@/modules/support/actions/ticket-actions";

const PRIORITIES = [
  { value: "low", label: "Baixa", desc: "Não impede o trabalho. Pode aguardar." },
  { value: "medium", label: "Média", desc: "Impacta parcialmente a rotina." },
  { value: "high", label: "Alta", desc: "Impede atividades importantes." },
  { value: "urgent", label: "Crítica", desc: "Bloqueia totalmente a operação." },
];

const STEPS = ["Categoria", "Detalhes", "Prioridade", "Revisão"];

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  support_subcategories: { id: string; name: string; slug: string }[] | null;
};

type FormData = {
  categoryId: string;
  subcategoryId: string;
  title: string;
  description: string;
  priority: string;
};

const initial: FormData = {
  categoryId: "",
  subcategoryId: "",
  title: "",
  description: "",
  priority: "medium",
};

export function TicketWizard({ categories }: { categories: CategoryRow[] }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const category = categories.find((c) => c.id === form.categoryId);
  const subcategories = category?.support_subcategories ?? [];

  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    setError(null);
    const fd = new FormData();
    fd.set("title", form.title);
    fd.set("description", form.description);
    fd.set("priority", form.priority);
    fd.set("categoryId", form.categoryId);
    fd.set("subcategoryId", form.subcategoryId);
    startTransition(async () => {
      try {
        await createTicketAction(fd);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível enviar o chamado.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex-1 rounded-lg border px-2 py-2 text-center text-xs sm:text-sm",
              i === step
                ? "border-sky-500/50 bg-sky-500/10 text-sky-400"
                : i < step
                  ? "border-emerald-500/30 text-emerald-400"
                  : "border-[var(--border)] text-[var(--foreground-muted)]",
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
            <CardTitle>Etapa 1 — Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Nenhuma categoria configurada para este tenant.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      update("categoryId", cat.id);
                      update("subcategoryId", cat.support_subcategories?.[0]?.id ?? "");
                    }}
                    className={cn(
                      "rounded-lg border p-3 text-left text-sm transition-colors",
                      form.categoryId === cat.id
                        ? "border-sky-500/50 bg-sky-500/10"
                        : "border-[var(--border)] hover:border-[var(--border-active)]",
                    )}
                  >
                    <span className="font-medium">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
            {subcategories.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium">Subcategoria</label>
                <Select
                  value={form.subcategoryId}
                  onChange={(e) => update("subcategoryId", e.target.value)}
                >
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 2 — Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Título</label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Descrição</label>
              <Textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 3 — Prioridade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => update("priority", p.value)}
                className={cn(
                  "w-full rounded-lg border p-4 text-left",
                  form.priority === p.value
                    ? "border-sky-500/50 bg-sky-500/10"
                    : "border-[var(--border)] hover:border-[var(--border-active)]",
                )}
              >
                <span className="font-medium">{p.label}</span>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">{p.desc}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 4 — Revisão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-[var(--foreground-muted)]">Categoria:</span> {category?.name}
            </p>
            <p>
              <span className="text-[var(--foreground-muted)]">Título:</span> {form.title}
            </p>
            <p>
              <span className="text-[var(--foreground-muted)]">Prioridade:</span>{" "}
              {PRIORITIES.find((p) => p.value === form.priority)?.label}
            </p>
            <p>
              <span className="text-[var(--foreground-muted)]">Descrição:</span> {form.description}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0 || pending} onClick={() => setStep((s) => s - 1)}>
          Voltar
        </Button>
        <div className="flex gap-2">
          {step < 3 ? (
            <Button
              disabled={(step === 0 && !form.categoryId) || (step === 1 && (!form.title || !form.description))}
              onClick={() => setStep((s) => s + 1)}
            >
              Avançar
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? "Enviando..." : "Enviar chamado"}
            </Button>
          )}
        </div>
      </div>

      <p className="text-center text-sm">
        <Link href={platformRoutes.support.root} className="text-[var(--blue)] hover:underline">
          Cancelar
        </Link>
      </p>
    </div>
  );
}
