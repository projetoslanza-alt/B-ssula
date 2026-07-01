"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = ["#35b6f4", "#2388f5", "#8b5cf6", "#f59e0b", "#20c978", "#f25f6b"];

const tooltipStyle = {
  contentStyle: {
    background: "#16202c",
    border: "1px solid #243244",
    borderRadius: "8px",
    color: "#f8fafc",
  },
};

type ChartContainerProps = {
  children: React.ReactNode;
  height?: number;
  empty?: boolean;
  loading?: boolean;
};

export function ChartContainer({ children, height = 300, empty, loading }: ChartContainerProps) {
  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)]"
        style={{ height }}
      >
        <p className="text-sm text-[var(--foreground-muted)]">Carregando gráfico...</p>
      </div>
    );
  }
  if (empty) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)]"
        style={{ height }}
      >
        <p className="text-sm text-[var(--foreground-muted)]">Sem dados para exibir</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartWidget({
  data,
  dataKey,
  xKey,
  title,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  xKey: string;
  title?: string;
}) {
  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-medium text-[var(--foreground-secondary)]">{title}</h3>}
      <ChartContainer empty={!data.length}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#243244" />
          <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip {...tooltipStyle} />
          <Legend />
          <Bar dataKey={dataKey} fill="#38bdf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export function LineChartWidget({
  data,
  lines,
  xKey,
  title,
}: {
  data: Record<string, unknown>[];
  lines: { key: string; color?: string; name?: string }[];
  xKey: string;
  title?: string;
}) {
  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-medium text-[var(--foreground-secondary)]">{title}</h3>}
      <ChartContainer empty={!data.length}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#243244" />
          <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip {...tooltipStyle} />
          <Legend />
          {lines.map((line, i) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name ?? line.key}
              stroke={line.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3, fill: line.color ?? CHART_COLORS[i % CHART_COLORS.length] }}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}

export function FunnelChartWidget({
  data,
  title,
}: {
  data: { etapa: string; valor: number }[];
  title?: string;
}) {
  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-medium text-[var(--foreground-secondary)]">{title}</h3>}
      <ChartContainer empty={!data.length}>
        <FunnelChart>
          <Tooltip {...tooltipStyle} />
          <Funnel dataKey="valor" data={data} isAnimationActive>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
            <LabelList position="right" fill="#f8fafc" stroke="none" dataKey="etapa" />
          </Funnel>
        </FunnelChart>
      </ChartContainer>
    </div>
  );
}

export function RankingChartWidget({
  data,
  title,
}: {
  data: { name: string; vendas: number; meta: number }[];
  title?: string;
}) {
  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-medium text-[var(--foreground-secondary)]">{title}</h3>}
      <ChartContainer empty={!data.length} height={280}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#243244" />
          <XAxis type="number" stroke="#94a3b8" fontSize={12} />
          <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={100} />
          <Tooltip {...tooltipStyle} />
          <Legend />
          <Bar dataKey="vendas" name="Vendas" fill="#38bdf8" radius={[0, 4, 4, 0]} />
          <Bar dataKey="meta" name="% Meta" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
