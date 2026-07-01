"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/platform/brand-logo";
import { isSafeReturnPath } from "@/lib/navigation-utils";
import { platformRoutes } from "@/lib/routes";

function subscribeToLocationSearch() {
  return () => {};
}

function readSearchParam(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key);
}

export function LoginForm() {
  const router = useRouter();
  const redirectParam = useSyncExternalStore(
    subscribeToLocationSearch,
    () => readSearchParam("redirect"),
    () => null,
  );
  const logoutReason = useSyncExternalStore(
    subscribeToLocationSearch,
    () => readSearchParam("reason") === "logout",
    () => false,
  );
  const redirect = isSafeReturnPath(redirectParam) ? redirectParam! : platformRoutes.home;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex justify-center">
        <BrandLogo />
      </div>
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Entrar na Bússola</CardTitle>
          <CardDescription>
            Acesse sua organização e continue sua jornada.
          </CardDescription>
          <p className="pt-1 text-xs text-[var(--foreground-muted)]">Bússola by VendasComCiência</p>
        </CardHeader>
        <CardContent>
          {logoutReason && (
            <p
              className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
              role="status"
            >
              Você saiu da sua conta com segurança.
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-[var(--foreground-secondary)]">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-[var(--foreground-secondary)]">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-center text-sm text-[var(--foreground-muted)]">
              <Link href="/esqueci-minha-senha" className="text-sky-400 hover:underline">
                Esqueci minha senha
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-[var(--foreground-disabled)]">
        Desenvolvido por VendasComCiência
      </p>
    </div>
  );
}
