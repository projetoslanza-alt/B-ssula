import { TICKET_STATUS_LABELS } from "@/modules/support/domain/kanban";

const ACTION_LABELS: Record<string, string> = {
  created: "Chamado criado",
  message_added: "Mensagem adicionada",
  internal_note_added: "Nota interna adicionada",
  status_changed: "Status alterado",
  kanban_moved: "Movido no Kanban",
  assigned: "Responsável alterado",
  priority_changed: "Prioridade alterada",
  archived: "Chamado arquivado",
  reactivated: "Chamado reativado",
};

const ORIGIN_LABELS: Record<string, string> = {
  kanban: "Kanban",
  lista: "Lista",
  detalhe: "Detalhe",
  automacao: "Automação",
  integracao: "Integração",
  sistema: "Sistema",
};

type HistoryEntry = {
  id: string;
  action: string;
  created_at: string;
  previous_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  authorName?: string | null;
};

function labelStatus(status?: unknown) {
  if (typeof status !== "string") return "—";
  return TICKET_STATUS_LABELS[status] ?? status;
}

function formatValue(key: string, value: unknown) {
  if (value == null) return "—";
  if (key === "status") return labelStatus(value);
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (obj.status) return labelStatus(obj.status);
    if (obj.columnSlug) return String(obj.columnSlug);
    if (obj.reason) return String(obj.reason);
    if (obj.origin) return ORIGIN_LABELS[String(obj.origin)] ?? String(obj.origin);
  }
  return String(value);
}

export function TicketHistoryTimeline({
  entries,
  showTechnical = false,
}: {
  entries: HistoryEntry[];
  showTechnical?: boolean;
}) {
  if (!entries.length) {
    return <p className="text-sm text-[var(--muted)]">Nenhum evento registrado.</p>;
  }

  return (
    <ul className="space-y-3">
      {[...entries]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((entry) => {
          const prev = (entry.previous_value ?? {}) as Record<string, unknown>;
          const next = (entry.new_value ?? {}) as Record<string, unknown>;
          const origin = typeof next.origin === "string" ? ORIGIN_LABELS[next.origin] ?? next.origin : null;
          return (
            <li
              key={entry.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-[var(--foreground)]">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </strong>
                <time className="text-xs text-[var(--muted)]">
                  {new Date(entry.created_at).toLocaleString("pt-BR")}
                </time>
              </div>
              {entry.authorName && (
                <p className="mt-1 text-xs text-[var(--muted)]">por {entry.authorName}</p>
              )}
              <div className="mt-2 grid gap-1 text-xs text-[var(--foreground-secondary)]">
                {"status" in prev || "status" in next ? (
                  <p>
                    Status: {formatValue("status", prev.status)} → {formatValue("status", next.status)}
                  </p>
                ) : null}
                {"columnSlug" in next ? (
                  <p>
                    Coluna: {formatValue("columnSlug", prev.columnSlug)} → {formatValue("columnSlug", next.columnSlug)}
                  </p>
                ) : null}
                {"assigneeId" in next ? <p>Responsável atualizado</p> : null}
                {"reason" in next ? <p>Motivo: {formatValue("reason", next.reason)}</p> : null}
                {origin ? <p>Origem: {origin}</p> : null}
              </div>
              {showTechnical && (
                <pre className="mt-2 overflow-x-auto rounded bg-[var(--card-elevated)] p-2 text-[10px] text-[var(--muted)]">
                  {JSON.stringify({ previous_value: prev, new_value: next }, null, 2)}
                </pre>
              )}
            </li>
          );
        })}
    </ul>
  );
}
