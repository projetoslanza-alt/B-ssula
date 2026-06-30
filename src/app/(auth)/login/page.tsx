import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { LoadingState } from "@/components/feedback/states";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Suspense fallback={<LoadingState />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
