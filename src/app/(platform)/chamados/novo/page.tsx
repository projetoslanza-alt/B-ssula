import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createTicketAction } from "@/modules/support/actions/ticket-actions";
import { listKnowledgeArticles } from "@/modules/support/queries/tickets";
export default async function Page() {
  const session = await requirePagePermission("support.ticket.create");
  const articles = await listKnowledgeArticles(session.tenantId);
  return (
    <div className="space-y-6">
      <PageHeader title="Abrir chamado" description="Antes de abrir, confira se algum artigo resolve sua dúvida." />
      {articles.length > 0 && (
        <div className="rounded-xl border bg-amber-50/50 p-4 text-sm">
          <p className="font-medium">Sugestões de conteúdo</p>
          <ul className="mt-2 list-disc pl-5">{articles.slice(0, 3).map((a) => <li key={a.id}>{a.title}</li>)}</ul>
        </div>
      )}
      <form action={createTicketAction} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
        <input name="title" required placeholder="Título" className="w-full rounded-lg border px-3 py-2 text-sm" />
        <textarea name="description" required placeholder="Descreva o problema" rows={5} className="w-full rounded-lg border px-3 py-2 text-sm" />
        <select name="priority" className="w-full rounded-lg border px-3 py-2 text-sm">
          <option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="urgent">Urgente</option>
        </select>
        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Enviar chamado</button>
      </form>
    </div>
  );
}
