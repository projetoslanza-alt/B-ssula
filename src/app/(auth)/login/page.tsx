import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; reason?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <LoginForm redirectParam={params.redirect} logoutReason={params.reason === "logout"} />
    </div>
  );
}
