"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TICKET_CATEGORIES } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const PRIORITIES = [
  { value: "baixa", label: "Baixa", desc: "Não impede o trabalho. Pode aguardar." },
  { value: "media", label: "Média", desc: "Impacta parcialmente a rotina." },
  { value: "alta", label: "Alta", desc: "Impede atividades importantes." },
  { value: "critica", label: "Crítica", desc: "Bloqueia totalmente a operação." },
];

const STEPS = ["Categoria", "Detalhes", "Prioridade", "Revisão"];

type FormData = {
  categoryId: string;
  subcategory: string;
  title: string;
  description: string;
  trying: string;
  happened: string;
  expected: string;
  blocksWork: string;
  related: string;
  unit: string;
  team: string;
  contact: string;
  priority: string;
};

const initial: FormData = {
  categoryId: "",
  subcategory: "",
  title: "",
  description: "",
  trying: "",
  happened: "",
  expected: "",
  blocksWork: "nao",
  related: "",
  unit: "",
  team: "",
  contact: "email",
  priority: "media",
};

export function TicketWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [protocol, setProtocol] = useState("");

  const category = TICKET_CATEGORIES.find((c) => c.id === form.categoryId);

  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    const proto = `CH-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    setProtocol(proto);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg border-emerald-500/30">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
            <Check className="h-6 w-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold">Chamado enviado</h2>
          <p className="text-[var(--foreground-muted)]">
            Sua solicitação já está em nossa rota de atendimento.
          </p>
          <p className="text-lg font-mono text-sky-400">{protocol}</p>
          <div className="flex justify-center gap-2">
            <Button asChild>
              <Link href={platformRoutes.support.root}>Ver chamados</Link>
            </Button>
            <Button variant="outline" onClick={() => router.push(platformRoutes.support.mine)}>
              Meus chamados
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Etapa 1 — Categoria</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {TICKET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    update("categoryId", cat.id);
                    update("subcategory", cat.subcategories[0] ?? "");
                  }}
                  className={cn(
                    "rounded-lg border p-3 text-left text-sm transition-colors",
                    form.categoryId === cat.id
                      ? "border-sky-500/50 bg-sky-500/10"
                      : "border-[var(--border)] hover:border-[var(--border-active)]",
                  )}
                >
                  <span className="font-medium">{cat.label}</span>
                  {"description" in cat && cat.description && (
                    <p className="mt-1 text-xs text-[var(--foreground-muted)]">{cat.description}</p>
                  )}
                </button>
              ))}
            </div>
            {category && (
              <div>
                <label className="mb-1 block text-sm font-medium">Subcategoria</label>
                <Select value={form.subcategory} onChange={(e) => update("subcategory", e.target.value)}>
                  {category.subcategories.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Etapa 2 — Detalhes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Título</label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Descrição</label>
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">O que estava tentando fazer?</label>
              <Textarea value={form.trying} onChange={(e) => update("trying", e.target.value)} rows={2} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">O que aconteceu?</label>
              <Textarea value={form.happened} onChange={(e) => update("happened", e.target.value)} rows={2} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">O que deveria acontecer?</label>
              <Textarea value={form.expected} onChange={(e) => update("expected", e.target.value)} rows={2} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">O problema impede o trabalho?</label>
              <Select value={form.blocksWork} onChange={(e) => update("blocksWork", e.target.value)}>
                <option value="nao">Não</option>
                <option value="parcialmente">Parcialmente</option>
                <option value="sim">Sim, totalmente</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Cliente ou oportunidade relacionada</label>
              <Input value={form.related} onChange={(e) => update("related", e.target.value)} placeholder="Opcional — sistema externo" />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Etapa 3 — Prioridade</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>Etapa 4 — Revisão</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-[var(--foreground-muted)]">Categoria:</span> {category?.label}</p>
            <p><span className="text-[var(--foreground-muted)]">Subcategoria:</span> {form.subcategory}</p>
            <p><span className="text-[var(--foreground-muted)]">Título:</span> {form.title}</p>
            <p><span className="text-[var(--foreground-muted)]">Prioridade:</span> {form.priority}</p>
            <p><span className="text-[var(--foreground-muted)]">Descrição:</span> {form.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Voltar
        </Button>
        <div className="flex gap-2">
          {step < 3 ? (
            <Button
              disabled={step === 0 && !form.categoryId}
              onClick={() => setStep((s) => s + 1)}
            >
              Avançar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => router.push(platformRoutes.support.root)}>
                Salvar rascunho
              </Button>
              <Button onClick={handleSubmit}>Enviar chamado</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
