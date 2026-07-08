import { requirePagePermission } from "@/lib/auth/page-guard";

export default async function NovoRelatorioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePagePermission("reports.view");
  return children;
}
