import Link from "next/link";
import { Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AcessoPendentePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <Compass className="mb-4 h-12 w-12 text-amber-600" />
      <h1 className="text-2xl font-semibold text-slate-900">Acesso não configurado</h1>
      <p className="mt-3 max-w-md text-slate-600">
        {user
          ? "Sua conta está autenticada, mas ainda não possui vínculo ativo com uma organização ou permissões atribuídas."
          : "Você precisa entrar para acessar a plataforma."}
      </p>
      <div className="mt-6 flex gap-3">
        {user ? (
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-white">
              Sair
            </button>
          </form>
        ) : (
          <Link href="/login" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
            Entrar
          </Link>
        )}
      </div>
      <p className="mt-8 max-w-lg text-xs text-slate-400">
        Se você é o administrador inicial, crie o usuário no Supabase Auth e execute{" "}
        <code className="rounded bg-slate-100 px-1">npm run bootstrap:admin</code>.
        Consulte <code className="rounded bg-slate-100 px-1">docs/bootstrap.md</code>.
      </p>
    </div>
  );
}
