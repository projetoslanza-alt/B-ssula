"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
  showIcon?: boolean;
  label?: string;
};

export function SignOutButton({
  className,
  showIcon = true,
  label = "Sair",
}: SignOutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    if (loading) return;
    setLoading(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "global" });

      const res = await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
        redirect: "manual",
      });

      if (res.type === "opaqueredirect" || res.status === 303 || res.status === 302) {
        window.location.href = "/login?reason=logout";
        return;
      }

      window.location.href = "/login?reason=logout";
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      aria-busy={loading}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-60",
        className,
      )}
    >
      {showIcon && <LogOut className="h-4 w-4 shrink-0" aria-hidden />}
      {loading ? "Saindo..." : label}
    </button>
  );
}
