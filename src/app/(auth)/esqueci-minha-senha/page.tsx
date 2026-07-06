"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/platform/brand-logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const useLocalAuth = process.env.NEXT_PUBLIC_AUTH_PROVIDER === "local";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (useLocalAuth) {
      await fetch("/api/auth/local/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      setLoading(false);
      return;
    }

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/esqueci-minha-senha`,
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <Card className="border-[var(--border)] bg-[var(--panel)]">
          <CardHeader>
            <CardTitle>Recuperar senha</CardTitle>
            <CardDescription>Enviaremos um link para redefinir sua senha.</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <p className="text-sm text-[var(--muted)]">
                Se o e-mail existir em nossa base, você receberá as instruções em breve.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium">
                    E-mail
                  </label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link"}
                </Button>
              </form>
            )}
            <p className="mt-4 text-center text-sm">
              <Link href="/login" className="text-[var(--primary)] hover:underline">
                Voltar ao login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
