"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEMO_NOTIFICATIONS } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default function NotificacoesPage() {
  const [filter, setFilter] = useState<"todas" | "nao_lidas" | "lidas">("todas");
  const items = DEMO_NOTIFICATIONS.filter((n) => {
    if (filter === "nao_lidas") return !n.read;
    if (filter === "lidas") return n.read;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Notificações" backHref={platformRoutes.home} />
      <div className="flex gap-2">
        {(["todas", "nao_lidas", "lidas"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "todas" ? "Todas" : f === "nao_lidas" ? "Não lidas" : "Lidas"}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        {items.map((n) => (
          <Link key={n.id} href={n.link ?? "#"}>
            <Card className={cn("hover:border-sky-500/30", !n.read && "border-sky-500/20 bg-sky-500/5")}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">{n.message}</p>
                  <p className="mt-1 text-xs text-[var(--foreground-disabled)]">{new Date(n.createdAt).toLocaleString("pt-BR")}</p>
                </div>
                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
