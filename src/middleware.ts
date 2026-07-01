import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { isSafeReturnPath } from "@/lib/navigation-utils";
import { isPlatformRoute, platformRoutes } from "@/lib/routes";

const PUBLIC_ROUTES = [
  "/login",
  "/esqueci-minha-senha",
  "/redefinir-senha",
  "/convite",
  "/acesso-pendente",
  "/acesso-negado",
  "/api/health",
  "/validar-certificado",
];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!user && !isPublic && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (isSafeReturnPath(pathname)) {
      url.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = platformRoutes.home;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && isPlatformRoute(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.status === "suspended" || profile?.status === "removed") {
      const url = request.nextUrl.clone();
      url.pathname = "/acesso-pendente";
      url.search = "reason=suspended";
      return NextResponse.redirect(url);
    }

    const { data: hasAccess } = await supabase.rpc("user_has_tenant_access");
    if (!hasAccess) {
      const url = request.nextUrl.clone();
      url.pathname = "/acesso-pendente";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
