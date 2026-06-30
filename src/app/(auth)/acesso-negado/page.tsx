import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function AcessoNegadoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <ShieldX className="mb-4 h-12 w-12 text-red-500" />
      <h1 className="text-2xl font-semibold text-slate-900">Acesso negado</h1>
      <p className="mt-3 max-w-md text-slate-600">
        Você não tem permissão para acessar este recurso. Se acredita que isso é um erro, contate o administrador da sua organização.
      </p>
      <Link href="/universidade" className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
        Voltar à Universidade
      </Link>
    </div>
  );
}
