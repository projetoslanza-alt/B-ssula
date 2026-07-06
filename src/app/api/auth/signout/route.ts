import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

import { getAuthProvider } from "@/lib/providers";
import { SESSION_COOKIE, sessionCookieOptions } from "@/modules/core/auth/local/session-cookie";
import { revokeLocalSession } from "@/modules/core/auth/local/auth-service";

export async function POST(request: NextRequest) {
  if (getAuthProvider() === "local") {
    const token = request.cookies.get(SESSION_COOKIE)?.value ?? null;
    await revokeLocalSession(token);

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "reason=logout";
    const redirectResponse = NextResponse.redirect(loginUrl, { status: 303 });
    redirectResponse.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
    return redirectResponse;
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("user_organization_context").delete().eq("user_id", user.id);
  }

  await supabase.auth.signOut({ scope: "global" });

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "reason=logout";

  const redirectResponse = NextResponse.redirect(loginUrl, { status: 303 });

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      expires: cookie.expires,
      maxAge: cookie.maxAge,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
    });
  });

  return redirectResponse;
}
