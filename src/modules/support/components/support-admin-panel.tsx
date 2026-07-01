"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/platform/status-badge";
import {
  upsertSupportCategoryAction,
  upsertSupportSlaAction,
  upsertSupportSubcategoryAction,
} from "@/modules/support/actions/support-admin-actions";

type Subcategory = { id: string; name: string; slug: string; is_active: boolean };
type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  support_subcategories: Subcategory[];
};

type SlaPolicy = {
  id: string;
  name: string;
  priority: string;
  response_hours: number;
  resolution_hours: number;
  is_active: boolean;
};

export function SupportAdminPanel({
  categories,
  slaPolicies,
}: {
  categories: Category[];
  slaPolicies: SlaPolicy[];
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(action: (formData: FormData) => Promise<void>, form: HTMLFormElement) {
    setMessage(null);
    startTransition(async () => {
      try {
        await action(new FormData(form));
        setMessage("Salvo com sucesso.");
        form.reset();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao salvar.");
      }
    });
  }

  return (
    <div className="space-y-8">
      {message && (
        <p className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-200" role="status">
          {message}
        </p>
      )}

      <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
        <h2 className="text-base font-semibold">Nova categoria</h2>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(upsertSupportCategoryAction, e.currentTarget);
          }}
        >
          <Input name="name" placeholder="Nome da categoria" required disabled={pending} />
          <Input name="description" placeholder="Descrição" disabled={pending} />
          <input type="hidden" name="isActive" value="true" />
          <Button type="submit" disabled={pending}>
            Criar categoria
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Categorias e subcategorias</h2>
        {categories.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhuma categoria configurada.</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="space-y-3 rounded-xl border border-[var(--border)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-[var(--muted)]">{cat.slug}</p>
                </div>
                <StatusBadge label={cat.is_active ? "Ativa" : "Inativa"} tone={cat.is_active ? "success" : "warning"} />
              </div>
              <form
                className="grid gap-2 sm:grid-cols-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(upsertSupportSubcategoryAction, e.currentTarget);
                }}
              >
                <input type="hidden" name="categoryId" value={cat.id} />
                <Input name="name" placeholder="Nova subcategoria" required disabled={pending} />
                <Button type="submit" variant="outline" disabled={pending}>
                  Adicionar subcategoria
                </Button>
              </form>
              <div className="flex flex-wrap gap-1">
                {(cat.support_subcategories ?? []).map((sub) => (
                  <StatusBadge key={sub.id} label={sub.name} tone="info" />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
        <h2 className="text-base font-semibold">Políticas de SLA</h2>
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            run(upsertSupportSlaAction, e.currentTarget);
          }}
        >
          <Input name="name" placeholder="Nome" required disabled={pending} />
          <select
            name="priority"
            className="h-[42px] rounded-[11px] border border-[var(--border)] bg-[#0b121c] px-3 text-sm"
            disabled={pending}
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
          <Input name="responseHours" type="number" min={1} placeholder="Horas resposta" required disabled={pending} />
          <Input name="resolutionHours" type="number" min={1} placeholder="Horas resolução" required disabled={pending} />
          <Button type="submit" disabled={pending}>
            Adicionar SLA
          </Button>
        </form>
        <ul className="space-y-2 text-sm">
          {slaPolicies.map((sla) => (
            <li key={sla.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
              <span>
                {sla.name} · {sla.priority}
              </span>
              <span className="text-[var(--muted)]">
                {sla.response_hours}h / {sla.resolution_hours}h
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
