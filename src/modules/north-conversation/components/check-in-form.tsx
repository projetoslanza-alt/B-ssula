"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHECKIN_QUESTIONS, classifyCheckIn } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const SCALE = [
  { value: 1, label: "Discordo totalmente" },
  { value: 2, label: "Discordo parcialmente" },
  { value: 3, label: "Neutro" },
  { value: 4, label: "Concordo parcialmente" },
  { value: 5, label: "Concordo totalmente" },
];

export function CheckInForm() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [feeling, setFeeling] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState("");

  const allAnswered = CHECKIN_QUESTIONS.every((q) => answers[q.id]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const values = CHECKIN_QUESTIONS.map((q) => answers[q.id]);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    setResult(classifyCheckIn(avg));
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg border-sky-500/30">
        <CardContent className="space-y-4 p-8 text-center">
          <h2 className="text-xl font-semibold">Check-in registrado</h2>
          <p className="text-3xl font-bold text-sky-400">{result}</p>
          <p className="text-sm text-[var(--foreground-muted)]">
            Sua resposta foi registrada. O gestor poderá visualizar os indicadores agregados da equipe.
          </p>
          <Button onClick={() => router.push(platformRoutes.northConversation.root)}>Voltar</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Check-in de Rota"
        description="Uma leitura rápida sobre comportamento, colaboração e ambiente de trabalho."
        backHref={platformRoutes.northConversation.root}
      />

      {CHECKIN_QUESTIONS.map((q) => (
        <Card key={q.id}>
          <CardContent className="space-y-3 p-5">
            <p className="text-xs font-medium text-sky-400">{q.dimension}</p>
            <p className="font-medium">{q.text}</p>
            <div className="flex flex-wrap gap-2">
              {SCALE.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: s.value }))}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs",
                    answers[q.id] === s.value
                      ? "border-sky-500/50 bg-sky-500/10 text-sky-400"
                      : "border-[var(--border)] hover:border-[var(--border-active)]",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader><CardTitle>Perguntas complementares</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Como você está se sentindo?</label>
            <Select value={feeling} onChange={(e) => setFeeling(e.target.value)}>
              <option value="">Selecione</option>
              <option value="bem">Bem</option>
              <option value="neutro">Neutro</option>
              <option value="cansado">Cansado</option>
              <option value="preocupado">Preocupado</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Gostaria de conversar com seu gestor?</label>
            <Select defaultValue="nao">
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
              <option value="talvez">Talvez</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Algo que gostaria de compartilhar?</label>
            <Textarea rows={3} placeholder="Opcional" />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={!allAnswered} className="w-full">
        Enviar check-in
      </Button>
    </form>
  );
}
