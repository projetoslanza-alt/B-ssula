import Link from "next/link";
import { Compass } from "lucide-react";
import { platformRoutes } from "@/lib/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 text-center">
      <Compass className="h-12 w-12 text-[var(--primary)]" aria-hidden />
      <h1 className="mt-6 text-2xl font-semibold text-[var(--foreground)]">Rota não encontrada</h1>
      <p className="mt-2 max-w-md text-[var(--muted)]">
        Esta página não faz parte do mapa atual da Bússola. Verifique o endereço ou volte ao início.
      </p>
      <Link href={platformRoutes.home} className="btn btn-primary mt-8">
        Ir para o início
      </Link>
    </div>
  );
}
