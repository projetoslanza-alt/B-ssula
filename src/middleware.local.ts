import { NextResponse, type NextRequest } from "next/server";
import { isSafeReturnPath } from "@/lib/navigation-utils";
import { isPlatformRoute, platformRoutes } from "@/lib/routes";
import { SESSION_COOKIE } from "@/modules/core/auth/local/session-cookie";
import { verifySessionJwtEdge } from "@/modules/core/auth/local/session-jwt-edge";

const PUBLIC_ROUTES = [
  "/login",
  "/esqueci-minha-senha",
  "/redefinir-senha",
  "/convite",
  "/acesso-pendente",
  "/acesso-negado",
  "/api/health",
  "/api/auth/local/login",
  "/api/auth/local/forgot-password",
  "/api/auth/local/reset-password",
  "/validar-certificado",
];

export async function localAuthMiddleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const token = request.cookies.get(SESSION_COOKIE)?.value ?? null;
  const session = token ? await verifySessionJwtEdge(token) : null;

  if (!session) {
    if (isPublic) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/" && isSafeReturnPath(pathname)) {
      url.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" || pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = platformRoutes.home;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isPlatformRoute(pathname)) {
    // Validação fina (status, tenant, permissões) ocorre em getSessionContext no servidor.
  }

  return NextResponse.next();
}
