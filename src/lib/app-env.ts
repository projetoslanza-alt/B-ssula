import { z } from "zod";

/** Valores aceitos para APP_ENV em toda a plataforma. */
export const appEnvSchema = z.enum([
  "development",
  "staging",
  "preview",
  "production",
  "test",
]);

export type AppEnv = z.infer<typeof appEnvSchema>;

export function parseAppEnv(value: unknown): AppEnv {
  return appEnvSchema.parse(value);
}

/** Fixtures de homologação cloud só podem rodar com APP_ENV=staging. */
export function stagingFixturesAllowed(appEnv: string | undefined): boolean {
  return appEnv === "staging";
}

/** Rotinas de produção exigem APP_ENV=production. */
export function productionRoutineAllowed(appEnv: string | undefined): boolean {
  return appEnv === "production";
}

/** Bloqueia fixture staging quando o ambiente é produção. */
export function assertStagingFixturesNotInProduction(appEnv: string | undefined): void {
  if (appEnv === "production") {
    throw new Error("Fixtures de staging bloqueadas quando APP_ENV=production");
  }
}

/** Bloqueia rotina de produção fora de APP_ENV=production. */
export function assertProductionRoutineRequiresProduction(appEnv: string | undefined): void {
  if (appEnv !== "production") {
    throw new Error("Rotinas de produção exigem APP_ENV=production");
  }
}
