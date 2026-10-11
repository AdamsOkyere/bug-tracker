"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

type Stats = {
  total: number;
  new: number;
  resolvedThisWeek: number;
  byType: Record<string, number>;
  byDay: Array<{ date: string; label: string; count: number }>;
};

export function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/stats")
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Could not load dashboard statistics.");
        return (await response.json()) as { data: Stats };
      })
      .then((body) => {
        if (active) setStats(body.data);
      })
      .catch((error: unknown) => {
        if (active)
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not load statistics.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      aria-label="Feedback statistics"
      className="mt-6 grid gap-3 sm:grid-cols-3"
    >
      <StatCard label="Total received" value={stats?.total} loading={!stats} />
      <StatCard label="New to review" value={stats?.new} loading={!stats} />
      <StatCard
        label="Resolved this week"
        value={stats?.resolvedThisWeek}
        loading={!stats}
      />
      <section className="rounded-md border border-ink/10 bg-white p-4 sm:col-span-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg">Incoming notes</h2>
          <p className="text-xs text-ink/50">
            Daily submissions · last 14 days
          </p>
        </div>
        <div
          className="mt-4 h-52 w-full"
          aria-label="Bar chart of submissions over the last 14 days"
          role="img"
        >
          {!stats ? (
            <div className="h-full animate-pulse rounded bg-[#f2f3ed]" />
          ) : (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={stats.byDay}
                margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#e8e9e2"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  tick={{ fill: "#7d8178", fontSize: 10 }}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tick={{ fill: "#7d8178", fontSize: 10 }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#f3f4ee" }}
                  contentStyle={{
                    border: "1px solid #d9dbd2",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#526b57"
                  maxBarSize={24}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </section>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value?: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-md border border-ink/10 bg-white px-4 py-4">
      <p className="text-xs font-semibold text-ink/55">{label}</p>
      {loading ? (
        <div
          aria-label="Loading statistic"
          className="mt-3 h-8 w-16 animate-pulse rounded bg-[#edf0e9]"
        />
      ) : (
        <p className="mt-2 font-display text-3xl">{value}</p>
      )}
    </div>
  );
}
