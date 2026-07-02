export function parseAuditReason(formData: FormData): string {
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) {
    throw new Error("Informe o motivo da alteração (mínimo 3 caracteres).");
  }
  return reason;
}

export type AuditChangePayload = {
  reason: string;
  previousValue: unknown;
  newValue: unknown;
  entityId: string;
  entityType: string;
};
