"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export type ChartPoint = {
  date: string;
  ingresos: number;
  gastos: number;
};

export function IncomeExpenseChart({ data }: { data: ChartPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800/60 bg-slate-950/40 text-sm text-slate-400">
        No hay datos por fecha para mostrar.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            stroke="#475569"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            stroke="#475569"
            tickFormatter={(v) => `Q ${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "0.75rem"
            }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(value: number) => [`Q ${value.toLocaleString("es-GT")}`]}
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={(value) => (value === "ingresos" ? "Ingresos" : "Gastos")}
          />
          <Line
            type="monotone"
            dataKey="ingresos"
            name="ingresos"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="gastos"
            name="gastos"
            stroke="#f43f5e"
            strokeWidth={2}
            dot={{ fill: "#f43f5e", r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
