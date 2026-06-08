"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardAnalytics } from "../../lib/dashboardAnalytics";

type DashboardChartsProps = {
  analytics: DashboardAnalytics;
  loading?: boolean;
};

const TYPE_COLORS = {
  video: "#e2596b",
  article: "#9a6cff",
  audio: "#d97706",
} as const;

const CHART_COLORS = ["#9a6cff", "#e2596b", "#38bdf8", "#54c79a", "#d97706", "#f472b6"];

function ChartShell({
  title,
  description,
  children,
  loading,
}: {
  title: string;
  description: string;
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <article className="admin-dashboard__chartCard">
      <header className="admin-dashboard__chartHead">
        <h4 className="admin-dashboard__chartTitle">{title}</h4>
        <p className="admin-dashboard__chartDesc">{description}</p>
      </header>
      <div className="admin-dashboard__chartBody" aria-busy={loading}>
        {loading ? <div className="admin-dashboard__chartSkeleton" aria-hidden="true" /> : children}
      </div>
    </article>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="admin-dashboard__chartTooltip">
      {label ? <p className="admin-dashboard__chartTooltipLabel">{label}</p> : null}
      <ul className="admin-dashboard__chartTooltipList">
        {payload.map((entry) => (
          <li key={`${entry.name}-${entry.value}`}>
            <span className="admin-dashboard__chartTooltipDot" style={{ background: entry.color }} />
            <span>
              {entry.name} : <strong>{entry.value}</strong>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashboardCharts({ analytics, loading }: DashboardChartsProps) {
  const typeData = analytics.contentsByType.map((item) => ({
    name: item.label,
    value: item.published,
    type: item.type,
    total: item.total,
  }));

  const categoryData = analytics.contentsByCategory.map((item) => ({
    name: item.label,
    count: item.count,
  }));

  const subscriberData = analytics.subscribersByMonth.map((item) => ({
    name: item.label,
    nouveaux: item.newSubscribers,
    cumul: item.cumulative,
  }));

  const publishData = analytics.contentsPublishedByMonth.map((item) => ({
    name: item.label,
    publications: item.count,
  }));

  return (
    <div className="admin-dashboard__charts">
      <ChartShell
        title="Contenus par type"
        description="Répartition des contenus publiés (vidéo, publication, audio)."
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={typeData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={92}
              paddingAngle={3}
              stroke="none"
            >
              {typeData.map((entry) => (
                <Cell key={entry.type} fill={TYPE_COLORS[entry.type]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Contenus par catégorie"
        description="Volume publié par rubrique éditoriale."
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={categoryData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={52} />
            <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="count" name="Publiés" radius={[8, 8, 0, 0]}>
              {categoryData.map((entry, index) => (
                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Évolution des abonnés"
        description="Nouvelles inscriptions et cumul sur 12 mois."
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={subscriberData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="subscriberGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#54c79a" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#54c79a" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend verticalAlign="top" height={28} />
            <Area
              type="monotone"
              dataKey="cumul"
              name="Cumul abonnés"
              stroke="#54c79a"
              fill="url(#subscriberGradient)"
              strokeWidth={2.5}
            />
            <Area
              type="monotone"
              dataKey="nouveaux"
              name="Nouveaux"
              stroke="#38bdf8"
              fill="rgba(56, 189, 248, 0.12)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Publications par mois"
        description="Contenus publiés — tendance sur 12 mois."
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={publishData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="publications" name="Publications" fill="#9a6cff" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
    </div>
  );
}
