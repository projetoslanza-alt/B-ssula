"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/platform/status-badge";
import { KanbanFlowEditor } from "@/modules/support/components/kanban-flow-editor";
import {
  upsertAssignmentRuleAction,
  upsertCannedResponseAction,
  upsertQuestionTemplateAction,
  upsertQueueAssigneeAction,
  upsertSupportCategoryAction,
  upsertSupportQueueAction,
  upsertSupportSlaAction,
  upsertSupportSubcategoryAction,
} from "@/modules/support/actions/support-admin-actions";

const TABS = ["Filas", "Categorias", "Subcategorias", "Perguntas", "SLA", "Responsáveis", "Respostas prontas", "Fluxo Kanban", "Regras de atribuição"] as const;

type Props = {
  categories: { id: string; name: string; slug: string; is_active: boolean; support_subcategories: { id: string; name: string; slug: string; is_active: boolean }[] }[];
  slaPolicies: { id: string; name: string; priority: string; response_hours: number; resolution_hours: number; is_active: boolean }[];
  queues: { id: string; slug: string; name: string; description: string | null; sort_order: number; is_active: boolean }[];
  questions: { id: string; question_key: string; label: string; field_type: string; scope: string; category_id: string | null; is_required: boolean; sort_order: number; is_active: boolean }[];
  canned: { id: string; title: string; body: string; queue_slug: string | null; is_active: boolean }[];
  assignees: { id: string; queue_slug: string; assignee_id: string | null; backup_assignee_id: string | null; scope: string | null; is_active: boolean }[];
  rules: { id: string; category_id: string | null; subcategory_id: string | null; queue_slug: string | null; priority: string | null; sort_order: number; is_active: boolean }[];
  columns: Parameters<typeof KanbanFlowEditor>[0]["columns"];
  transitions: Parameters<typeof KanbanFlowEditor>[0]["transitions"];
};

export function SupportSettingsTabs(props: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Filas");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(action: (fd: FormData) => Promise<void>, form: HTMLFormElement) {
    setMessage(null);
    startTransition(async () => {
      try {
        await action(new FormData(form));
        setMessage("Salvo com sucesso.");
        form.reset();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {message && <p className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-200">{message}</p>}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={tab === t ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}>{t}</button>
        ))}
      </div>

      {tab === "Filas" && (
        <section className="card space-y-3 p-4">
          <form className="grid gap-2 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); run(upsertSupportQueueAction, e.currentTarget); }}>
            <Input name="slug" placeholder="Slug" required disabled={pending} />
            <Input name="name" placeholder="Nome" required disabled={pending} />
            <Input name="description" placeholder="Descrição" disabled={pending} />
            <Button type="submit" disabled={pending}>Adicionar fila</Button>
          </form>
          <ul className="space-y-2 text-sm">{props.queues.map((q) => <li key={q.id} className="flex justify-between rounded border px-3 py-2"><span>{q.name} ({q.slug})</span><StatusBadge label={q.is_active ? "Ativa" : "Inativa"} tone={q.is_active ? "success" : "warning"} /></li>)}</ul>
        </section>
      )}

      {tab === "Categorias" && (
        <section className="card space-y-3 p-4">
          <form className="grid gap-2 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); run(upsertSupportCategoryAction, e.currentTarget); }}>
            <Input name="name" placeholder="Nome" required disabled={pending} />
            <Input name="description" placeholder="Descrição" disabled={pending} />
            <Button type="submit" disabled={pending}>Criar categoria</Button>
          </form>
          <ul className="space-y-2 text-sm">{props.categories.map((c) => <li key={c.id} className="rounded border px-3 py-2">{c.name} · {c.slug}</li>)}</ul>
        </section>
      )}

      {tab === "Subcategorias" && (
        <section className="card space-y-3 p-4">
          {props.categories.map((cat) => (
            <div key={cat.id} className="space-y-2 rounded border p-3">
              <p className="font-medium">{cat.name}</p>
              <form className="grid gap-2 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); run(upsertSupportSubcategoryAction, e.currentTarget); }}>
                <input type="hidden" name="categoryId" value={cat.id} />
                <Input name="name" placeholder="Nova subcategoria" required disabled={pending} />
                <Button type="submit" disabled={pending}>Adicionar</Button>
              </form>
              <div className="flex flex-wrap gap-1">{(cat.support_subcategories ?? []).map((s) => <StatusBadge key={s.id} label={s.name} tone="info" />)}</div>
            </div>
          ))}
        </section>
      )}

      {tab === "Perguntas" && (
        <section className="card space-y-3 p-4">
          <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => { e.preventDefault(); run(upsertQuestionTemplateAction, e.currentTarget); }}>
            <Input name="questionKey" placeholder="Chave" required disabled={pending} />
            <Input name="label" placeholder="Texto" required disabled={pending} />
            <select name="fieldType" className="input" disabled={pending}><option value="text">Texto</option><option value="textarea">Textarea</option><option value="select">Select</option><option value="number">Número</option></select>
            <select name="scope" className="input" disabled={pending}><option value="context">Universal</option><option value="category">Categoria</option><option value="impact">Impacto</option></select>
            <select name="categoryId" className="input" disabled={pending}><option value="">Sem categoria</option>{props.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <Input name="helpText" placeholder="Texto de ajuda" disabled={pending} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isRequired" value="true" /> Obrigatório</label>
            <Button type="submit" disabled={pending}>Adicionar pergunta</Button>
          </form>
          <ul className="max-h-64 space-y-1 overflow-auto text-sm">{props.questions.map((q) => <li key={q.id} className="rounded border px-2 py-1">{q.label} · {q.scope} · {q.question_key}</li>)}</ul>
        </section>
      )}

      {tab === "SLA" && (
        <section className="card space-y-3 p-4">
          <form className="grid gap-2 sm:grid-cols-5" onSubmit={(e) => { e.preventDefault(); run(upsertSupportSlaAction, e.currentTarget); }}>
            <Input name="name" placeholder="Nome" required disabled={pending} />
            <select name="priority" className="input" disabled={pending}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="urgent">Urgente</option></select>
            <Input name="responseHours" type="number" placeholder="Resposta (h)" required disabled={pending} />
            <Input name="resolutionHours" type="number" placeholder="Resolução (h)" required disabled={pending} />
            <Button type="submit" disabled={pending}>Adicionar SLA</Button>
          </form>
          <ul className="space-y-1 text-sm">{props.slaPolicies.map((s) => <li key={s.id}>{s.name} · {s.priority} · {s.response_hours}h/{s.resolution_hours}h</li>)}</ul>
        </section>
      )}

      {tab === "Responsáveis" && (
        <section className="card space-y-3 p-4">
          <form className="grid gap-2 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); run(upsertQueueAssigneeAction, e.currentTarget); }}>
            <Input name="queueSlug" placeholder="Fila (slug)" required disabled={pending} />
            <Input name="assigneeId" placeholder="ID responsável" disabled={pending} />
            <Input name="backupAssigneeId" placeholder="ID substituto" disabled={pending} />
            <Button type="submit" disabled={pending}>Adicionar responsável</Button>
          </form>
          <ul className="space-y-1 text-sm">{props.assignees.map((a) => <li key={a.id}>{a.queue_slug} · {a.assignee_id ?? "—"}</li>)}</ul>
        </section>
      )}

      {tab === "Respostas prontas" && (
        <section className="card space-y-3 p-4">
          <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); run(upsertCannedResponseAction, e.currentTarget); }}>
            <Input name="title" placeholder="Título" required disabled={pending} />
            <textarea name="body" className="input min-h-20" placeholder="Texto" required disabled={pending} />
            <Input name="queueSlug" placeholder="Fila (opcional)" disabled={pending} />
            <Button type="submit" disabled={pending}>Adicionar resposta pronta</Button>
          </form>
          <ul className="space-y-1 text-sm">{props.canned.map((c) => <li key={c.id}><strong>{c.title}</strong> — {c.body.slice(0, 80)}</li>)}</ul>
        </section>
      )}

      {tab === "Fluxo Kanban" && <KanbanFlowEditor columns={props.columns} transitions={props.transitions} />}

      {tab === "Regras de atribuição" && (
        <section className="card space-y-3 p-4">
          <form className="grid gap-2 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); run(upsertAssignmentRuleAction, e.currentTarget); }}>
            <select name="categoryId" className="input" disabled={pending}><option value="">Categoria</option>{props.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <Input name="queueSlug" placeholder="Fila" disabled={pending} />
            <select name="priority" className="input" disabled={pending}><option value="">Prioridade</option><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="urgent">Urgente</option></select>
            <Button type="submit" disabled={pending}>Adicionar regra</Button>
          </form>
          <ul className="space-y-1 text-sm">{props.rules.map((r) => <li key={r.id}>Cat {r.category_id?.slice(0, 8)} → {r.queue_slug ?? "—"} · {r.priority ?? "—"}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
