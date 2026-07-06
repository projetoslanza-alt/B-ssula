import { type NextRequest } from "next/server";
import { getAuthProvider } from "@/lib/providers";
import { localAuthMiddleware } from "@/middleware.local";

// Re-export para middleware principal
export async function handleLocalAuth(request: NextRequest) {
  return localAuthMiddleware(request);
}

export function isLocalAuthEnabled() {
  return getAuthProvider() === "local";
}
