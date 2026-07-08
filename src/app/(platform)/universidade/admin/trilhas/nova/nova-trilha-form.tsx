"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLearningPathAction } from "@/modules/learning/actions/path-actions";
import { platformRoutes } from "@/lib/routes";

type FormState = { error?: string; pathId?: string };

const initialState: FormState = {};

async function createPathState(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await createLearningPathAction(formData);
  if (result.error) return { error: result.error };
  if (result.pathId) return { pathId: result.pathId };
  return {};
}

export function NovaTrilhaForm() {
  const [state, formAction, pending] = useActionState(createPathState, initialState);

  if (state.pathId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-emerald-300">Trilha criada com sucesso.</p>
        <Link href={platformRoutes.learning.adminPath(state.pathId)}>
          <Button>Abrir trilha</Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-lg space-y-4 rounded-xl border p-4">
      <h1 className="text-lg font-semibold">Nova trilha</h1>
      <div>
        <label className="mb-1 block text-sm">Título</label>
        <Input name="title" required />
      </div>
      <div>
        <label className="mb-1 block text-sm">Descrição</label>
        <Input name="description" />
      </div>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        Criar trilha
      </Button>
    </form>
  );
}
