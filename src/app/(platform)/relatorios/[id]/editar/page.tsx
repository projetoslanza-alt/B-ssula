import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { getReport } from "@/modules/reports/queries/definitions";
import { RelatorioDetalheClient } from "../relatorio-detalhe-client";

export default async function RelatorioEditarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePagePermission("reports.view");
  const { id } = await params;

  let report;
  try {
    report = await getReport(session.tenantId, id);
  } catch {
    notFound();
  }

  return <RelatorioDetalheClient report={report} />;
}
