import Link from "next/link";
import { Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function AcessoPendentePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const suspended = reason === "suspended";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-6 text-center">
      <Compass className="mb-4 h-12 w-12 text-sky-400" />
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">
        {suspended ? "Conta indisponível" : "Acesso não configurado"}
      </h1>
      <p className="mt-3 max-w-md text-[var(--foreground-muted)]">
        {suspended
          ? "Sua conta está inativa ou suspensa. Entre em contato com o administrador da sua organização."
          : user
            ? "Sua conta está autenticada, mas ainda não possui vínculo ativo com uma organização ou permissões atribuídas."
            : "Você precisa entrar para acessar a plataforma."}
      </p>
      <div className="mt-6 flex gap-3">
        {user ? (
          <SignOutButton className="w-auto rounded-lg border border-[var(--border)] px-4 py-2" />
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
          >
            Entrar
          </Link>
        )}
      </div>
      {!suspended && (
        <p className="mt-8 max-w-lg text-xs text-[var(--foreground-disabled)]">
          Se você é o administrador inicial, consulte a documentação de bootstrap da plataforma.
        </p>
      )}
    </div>
  );
}
