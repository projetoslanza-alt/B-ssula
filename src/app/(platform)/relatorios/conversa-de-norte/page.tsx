import { redirect } from "next/navigation";

/** Legado: `/relatorios/conversa-de-norte` → relatório canônico One a One */
export default function RelatorioConversaNortePage() {
  redirect("/relatorios/one-a-one");
}