import { RelatorioDetalheClient } from "./relatorio-detalhe-client";

export default async function RelatorioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RelatorioDetalheClient id={id} />;
}
