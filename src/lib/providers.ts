import { z } from "zod";

export const authProviderSchema = z.enum(["supabase", "local"]);
export const databaseProviderSchema = z.enum(["supabase", "local_postgres"]);
export const storageDriverSchema = z.enum(["supabase", "local"]);

export type AuthProvider = z.infer<typeof authProviderSchema>;
export type DatabaseProvider = z.infer<typeof databaseProviderSchema>;
export type StorageDriver = z.infer<typeof storageDriverSchema>;

export function getAuthProvider(): AuthProvider {
  const raw = process.env.AUTH_PROVIDER ?? "supabase";
  return authProviderSchema.parse(raw);
}

export function getDatabaseProvider(): DatabaseProvider {
  const raw = process.env.DATABASE_PROVIDER ?? "supabase";
  return databaseProviderSchema.parse(raw);
}

export function getStorageDriver(): StorageDriver {
  const raw = process.env.STORAGE_DRIVER ?? "supabase";
  return storageDriverSchema.parse(raw);
}

export function isLocalProductionStack(): boolean {
  return (
    getAuthProvider() === "local" &&
    getDatabaseProvider() === "local_postgres" &&
    getStorageDriver() === "local"
  );
}
