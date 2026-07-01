"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { getTicketById } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { Star } from "lucide-react";

const TIMELINE = [
  "Chamado aberto",
  "Recebido",
  "Triagem",
  "Responsável definido",
  "Atendimento iniciado",
  "Aguardando informações",
  "Solução apresentada",
  "Resolvido",
  "Avaliado",
];

export function TicketDetail({ ticketId }: { ticketId: string }) {
  const ticket = getTicketById(ticketId);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);

  if (!ticket) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--foreground-muted)]">Chamado não encontrado.</p>
        <Button className="mt-4" asChild>
          <Link href={platformRoutes.support.root}>Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.title}
        subtitle={ticket.protocol}
        backHref={platformRoutes.support.root}
        status={<StatusBadge label={ticket.status.replace(/_/g, " ")} tone="info" />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Descrição</CardTitle></CardHeader>
            <CardContent>
              <p className="text-[var(--foreground-secondary)]">{ticket.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Conversa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-[var(--card-elevated)] p-3">
                <p className="text-xs text-[var(--foreground-muted)]">{ticket.requester} · {new Date(ticket.openedAt).toLocaleString("pt-BR")}</p>
                <p className="mt-1">{ticket.description}</p>
              </div>
              {ticket.assignee && (
                <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
                  <p className="text-xs text-sky-400">{ticket.assignee} · Atendente</p>
                  <p className="mt-1">Estamos analisando sua solicitação. Em breve retornaremos com orientações.</p>
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enviar mensagem..."
                  rows={2}
                  className="flex-1"
                />
                <Button disabled={!message.trim()}>Enviar</Button>
              </div>
            </CardContent>
          </Card>

          {ticket.status === "resolvido" && !rated && (
            <Card>
              <CardHeader>
                <CardTitle>Esta orientação ajudou você a retomar a rota?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      aria-label={`Avaliar ${n} estrelas`}
                    >
                      <Star className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-[var(--foreground-disabled)]"}`} />
                    </button>
                  ))}
                </div>
                <Button onClick={() => setRated(true)} disabled={rating === 0}>Enviar avaliação</Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4 text-sm">
              <p><span className="text-[var(--foreground-muted)]">Solicitante:</span> {ticket.requester}</p>
              <p><span className="text-[var(--foreground-muted)]">Categoria:</span> {ticket.category}</p>
              <p><span className="text-[var(--foreground-muted)]">Subcategoria:</span> {ticket.subcategory}</p>
              <p><span className="text-[var(--foreground-muted)]">Prioridade:</span> {ticket.priority}</p>
              <p><span className="text-[var(--foreground-muted)]">Responsável:</span> {ticket.assignee ?? "Aguardando"}</p>
              <p><span className="text-[var(--foreground-muted)]">Abertura:</span> {new Date(ticket.openedAt).toLocaleString("pt-BR")}</p>
              {ticket.slaDue && (
                <p><span className="text-[var(--foreground-muted)]">Prazo:</span> {new Date(ticket.slaDue).toLocaleString("pt-BR")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Linha do tempo</CardTitle></CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {TIMELINE.map((step, i) => (
                  <li
                    key={step}
                    className={`flex items-center gap-2 text-sm ${i <= 4 ? "text-sky-400" : "text-[var(--foreground-disabled)]"}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${i <= 4 ? "bg-sky-400" : "bg-[var(--border)]"}`} />
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
