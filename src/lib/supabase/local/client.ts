import "server-only";
import { cookies } from "next/headers";
import { isLocalProductionStack } from "@/lib/providers";
import { executeLocalRpc } from "@/lib/supabase/local/rpc-handlers";
import { fromTable } from "@/lib/supabase/local/query-builder";
import { SESSION_COOKIE } from "@/modules/core/auth/local/session-cookie";
import { verifySessionJwt } from "@/modules/core/auth/local/session-jwt";
import { query } from "@/lib/db/pool";
import { storagePut, storageDelete } from "@/modules/core/files/storage/local-provider";

export type LocalSupabaseClient = {
  from: (table: string) => ReturnType<typeof fromTable>;
  auth: {
    getUser: () => Promise<{ data: { user: { id: string; email?: string } | null }; error: null }>;
    signOut: (opts?: { scope?: string }) => Promise<{ error: null }>;
    admin?: {
      createUser: (input: {
        email: string;
        password: string;
        email_confirm?: boolean;
        user_metadata?: Record<string, unknown>;
      }) => Promise<{ data: { user: { id: string } | null }; error: { message: string } | null }>;
    };
  };
  rpc: (fn: string, params?: Record<string, unknown>) => ReturnType<typeof executeLocalRpc>;
  storage: {
    from: (bucket: string) => LocalStorageBucket;
  };
};

type LocalStorageBucket = {
  upload: (
    path: string,
    data: Buffer,
    opts?: { contentType?: string; upsert?: boolean },
  ) => Promise<{ data: { path: string } | null; error: { message: string } | null }>;
  remove: (paths: string[]) => Promise<{ error: { message: string } | null }>;
  createSignedUrl: (
    path: string,
    expiresIn: number,
  ) => Promise<{ data: { signedUrl: string } | null; error: null }>;
};

async function resolveUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? null;
  if (!token) return null;
  const payload = await verifySessionJwt(token);
  return payload?.userId ?? null;
}

function parseStoragePath(path: string): { tenantId: string; relativePath: string } {
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const [tenantId, ...rest] = normalized.split("/");
  if (!tenantId || rest.length === 0) throw new Error("Caminho de storage inválido.");
  return { tenantId, relativePath: rest.join("/") };
}

function createStorageBucket(bucket: string): LocalStorageBucket {
  return {
    async upload(path, data, opts) {
      try {
        const { tenantId, relativePath } = parseStoragePath(path);
        const userId = (await resolveUserId()) ?? "system";
        await storagePut({
          tenantId,
          bucket,
          relativePath,
          data,
          mimeType: opts?.contentType ?? "application/octet-stream",
          uploadedBy: userId,
        });
        return { data: { path }, error: null };
      } catch (error) {
        return { data: null, error: { message: error instanceof Error ? error.message : String(error) } };
      }
    },
    async remove(paths) {
      try {
        for (const p of paths) {
          const { tenantId, relativePath } = parseStoragePath(p);
          await storageDelete(tenantId, bucket, relativePath);
        }
        return { error: null };
      } catch (error) {
        return { error: { message: error instanceof Error ? error.message : String(error) } };
      }
    },
    async createSignedUrl(path) {
      const { tenantId, relativePath } = parseStoragePath(path);
      const ref = encodeURIComponent(`${tenantId}/${bucket}/${relativePath}`);
      return { data: { signedUrl: `/api/files/local?ref=${ref}` }, error: null };
    },
  };
}

export function createLocalAdminClient(): LocalSupabaseClient {
  return {
    from: fromTable,
    auth: {
      async getUser() {
        return { data: { user: null }, error: null };
      },
      async signOut() {
        return { error: null };
      },
      admin: {
        async createUser(input) {
          const { createLocalUserWithPassword } = await import("@/modules/core/auth/local/auth-service");
          try {
            const userId = await createLocalUserWithPassword({
              email: input.email,
              fullName: String(input.user_metadata?.full_name ?? input.email.split("@")[0]),
              password: input.password,
            });
            return { data: { user: { id: userId } }, error: null };
          } catch (error) {
            return { data: { user: null }, error: { message: error instanceof Error ? error.message : String(error) } };
          }
        },
      },
    },
    rpc(fn, params = {}) {
      return executeLocalRpc(fn, params);
    },
    storage: {
      from: createStorageBucket,
    },
  };
}

export async function createLocalServerClient(): Promise<LocalSupabaseClient> {
  if (!isLocalProductionStack()) {
    throw new Error("createLocalServerClient só disponível com stack local.");
  }

  return {
    from: fromTable,
    auth: {
      async getUser() {
        const userId = await resolveUserId();
        if (!userId) return { data: { user: null }, error: null };
        const { rows } = await query<{ email: string }>(`SELECT email FROM profiles WHERE id = $1`, [userId]);
        return { data: { user: { id: userId, email: rows[0]?.email } }, error: null };
      },
      async signOut() {
        const userId = await resolveUserId();
        const cookieStore = await cookies();
        const token = cookieStore.get(SESSION_COOKIE)?.value;
        if (userId && token) {
          await query(
            `UPDATE user_sessions SET revoked_at = now()
             WHERE user_id = $1 AND revoked_at IS NULL`,
            [userId],
          );
        }
        cookieStore.delete(SESSION_COOKIE);
        return { error: null };
      },
      admin: {
        async createUser(input) {
          const { createLocalUserWithPassword } = await import("@/modules/core/auth/local/auth-service");
          try {
            const userId = await createLocalUserWithPassword({
              email: input.email,
              fullName: String(input.user_metadata?.full_name ?? input.email.split("@")[0]),
              password: input.password,
            });
            return { data: { user: { id: userId } }, error: null };
          } catch (error) {
            return { data: { user: null }, error: { message: error instanceof Error ? error.message : String(error) } };
          }
        },
      },
    },
    rpc(fn, params = {}) {
      return executeLocalRpc(fn, params);
    },
    storage: {
      from: createStorageBucket,
    },
  };
}
