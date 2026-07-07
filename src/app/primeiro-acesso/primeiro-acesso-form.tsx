"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/platform/brand-logo";

export function PrimeiroAcessoForm({ email }: { email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/local/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: password }),
    });

    if (!res.ok) {
      const bodyData = (await res.json().catch(() => ({}))) as { error?: string };
      setError(bodyData.error ?? "Falha ao alterar a senha.");
      setLoading(false);
      return;
    }

    router.push("/inicio");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Defina sua nova senha</CardTitle>
            <CardDescription>
              Este é seu primeiro acesso com <strong>{email}</strong>. Por segurança, troque a senha
              temporária antes de continuar. Mínimo de 12 caracteres, com maiúsculas, minúsculas e
              números.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={12}
                autoComplete="new-password"
              />
              <Input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={12}
                autoComplete="new-password"
              />
              {error && (
                <p className="text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Salvar e continuar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
