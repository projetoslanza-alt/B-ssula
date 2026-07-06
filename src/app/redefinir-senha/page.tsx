"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/platform/brand-logo";

function subscribeToLocationSearch() {
  return () => {};
}

function readToken(): string | null {
  return new URLSearchParams(window.location.search).get("token");
}

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const token = useSyncExternalStore(subscribeToLocationSearch, readToken, () => null);
  const useLocalAuth = process.env.NEXT_PUBLIC_AUTH_PROVIDER === "local";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!useLocalAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Redefinir senha</CardTitle>
            <CardDescription>Use o link enviado por e-mail pelo provedor de autenticação.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/esqueci-minha-senha" className="text-sm text-sky-400 hover:underline">
              Solicitar novo link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>Solicite um novo link de redefinição de senha.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/esqueci-minha-senha" className="text-sm text-sky-400 hover:underline">
              Recuperar senha
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/local/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Falha ao redefinir senha.");
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Nova senha</CardTitle>
            <CardDescription>Mínimo 12 caracteres, com maiúsculas, minúsculas e números.</CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <p className="text-sm text-emerald-400">Senha alterada. Redirecionando para login...</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={12}
                />
                <Input
                  type="password"
                  placeholder="Confirmar senha"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Salvando..." : "Redefinir senha"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
