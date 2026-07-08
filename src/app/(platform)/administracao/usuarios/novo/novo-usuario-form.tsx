"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TemporaryCredentialsModal } from "@/components/platform/temporary-credentials-modal";
import { createMembershipUserAction, type CreateUserState } from "@/modules/admin/actions/user-actions";
import { platformRoutes } from "@/lib/routes";

type GroupOption = { id: string; name: string };

const initialState: CreateUserState = { status: "idle" };

export function NovoUsuarioForm({ groups }: { groups: GroupOption[] }) {
  const [state, formAction, pending] = useActionState(createMembershipUserAction, initialState);
  const [dismissedCredentials, setDismissedCredentials] = useState(false);

  const showCredentials =
    state.status === "success" &&
    state.isNewUser &&
    state.temporaryPassword &&
    !dismissedCredentials;

  if (state.status === "success") {
    return (
      <div className="max-w-lg space-y-4 rounded-xl border border-[var(--border)] p-4">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {state.isNewUser && state.emailSent && (
            <p>Usuário criado com sucesso. O acesso foi enviado por e-mail para {state.email}.</p>
          )}
          {state.isNewUser && !state.emailSent && !state.temporaryPassword && (
            <p>
              Usuário criado, mas o e-mail não foi enviado. Use &quot;Resetar senha temporária&quot; na
              tela do usuário.
            </p>
          )}
          {state.isNewUser && !state.emailSent && state.temporaryPassword && (
            <p>
              Usuário criado. O e-mail não foi enviado — copie os dados de acesso exibidos no modal.
            </p>
          )}
          {!state.isNewUser && (
            <p>Usuário existente vinculado a esta organização com sucesso.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={platformRoutes.admin.user(state.membershipId)}>
            <Button>Abrir usuário</Button>
          </Link>
          <Link href={platformRoutes.admin.users}>
            <Button variant="outline">Voltar à lista</Button>
          </Link>
        </div>
        {showCredentials && (
          <TemporaryCredentialsModal
            open
            email={state.email}
            temporaryPassword={state.temporaryPassword!}
            emailSent={false}
            onClose={() => setDismissedCredentials(true)}
          />
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-lg space-y-4 rounded-xl border border-[var(--border)] p-4">
      <div>
        <label htmlFor="fullName" className="mb-1 block text-sm">
          Nome completo
        </label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm">
          E-mail
        </label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <label htmlFor="groupId" className="mb-1 block text-sm">
          Grupo de acesso
        </label>
        <select
          id="groupId"
          name="groupId"
          className="h-[42px] w-full rounded-[11px] border border-[var(--border)] bg-[#0b121c] px-3 text-sm"
        >
          <option value="">Selecione...</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="sendEmail" value="on" defaultChecked className="h-4 w-4" />
        Enviar e-mail de primeiro acesso
      </label>
      {state.status === "error" && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Criando..." : "Criar usuário"}
      </Button>
    </form>
  );
}
