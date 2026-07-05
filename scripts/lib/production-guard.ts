/** Proteções compartilhadas para scripts de QA e produção. */

export const QA_BLOCK_MESSAGE = "Este script não pode ser executado em produção.";

/** Bloqueia scripts de homologação/QA quando APP_ENV=production. */
export function assertQaScriptNotInProduction(): void {
  if (process.env.APP_ENV === "production") {
    console.error(QA_BLOCK_MESSAGE);
    process.exit(1);
  }
}

/** Exige APP_ENV=production e confirmação explícita. */
export function assertProductionOnly(expectedConfirmation: string): void {
  if (process.env.APP_ENV !== "production") {
    console.error("Este script só pode ser executado com APP_ENV=production.");
    process.exit(1);
  }
  if (process.env.PRODUCTION_CONFIRMATION !== expectedConfirmation) {
    console.error(`Defina PRODUCTION_CONFIRMATION=${expectedConfirmation}`);
    process.exit(1);
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Variável obrigatória ausente: ${name}`);
    process.exit(1);
  }
  return value;
}
