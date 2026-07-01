export type DashboardPeriod = "mes_atual" | "ultimos_7" | "ultimos_30" | "trimestre";

export type CommercialDashboardFilters = {
  period?: DashboardPeriod;
  teamId?: string;
  sellerId?: string;
};

export type CommercialKpis = {
  ligacoes: number;
  aberturas: number;
  reunioesAgendadas: number;
  reunioesRealizadas: number;
  contratosGerados: number;
  contratosAssinados: number;
  vendas: number;
  receita: number;
  ticketMedio: number;
  meta: number;
  percentualAtingido: number;
  noShow: number;
  variacaoReceita: number;
};

export type DailyEvolutionPoint = {
  dia: string;
  ligacoes: number;
  vendas: number;
};

export type FunnelPoint = {
  etapa: string;
  valor: number;
};

export type SellerRankingPoint = {
  name: string;
  vendas: number;
  receita: number;
  meta: number;
  ownerId: string;
};

export type CommercialDashboardData = {
  kpis: CommercialKpis;
  evolution: DailyEvolutionPoint[];
  funnel: FunnelPoint[];
  ranking: SellerRankingPoint[];
  teams: { id: string; name: string }[];
  sellers: { id: string; name: string }[];
};

export function resolvePeriodRange(period: DashboardPeriod = "mes_atual"): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to);

  switch (period) {
    case "ultimos_7":
      from.setDate(from.getDate() - 6);
      break;
    case "ultimos_30":
      from.setDate(from.getDate() - 29);
      break;
    case "trimestre": {
      const month = from.getMonth();
      const quarterStart = month - (month % 3);
      from.setMonth(quarterStart, 1);
      from.setHours(0, 0, 0, 0);
      break;
    }
    default:
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
  }

  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function previousPeriodRange(from: Date, to: Date): { from: Date; to: Date } {
  const duration = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - duration);
  return { from: prevFrom, to: prevTo };
}
