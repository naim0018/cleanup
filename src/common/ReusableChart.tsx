
import React from "react";
import { useTheme } from "@/hooks/useTheme.tsx";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export type ChartType = "Area" | "Line" | "Bar";

export interface ChartBarConfig {
  dataKey: string;
  name: string;
  color: string;
  opacity?: number;
}

export interface ReusableChartProps {
  chartType: ChartType;
  data: any[];
  bars: ChartBarConfig[];
  lineValueKey?: string;
  margin?: { top: number; right: number; left: number; bottom: number };
}

export default function ReusableChart({
  chartType,
  data,
  bars,
  lineValueKey = "value",
  margin = { top: 20, right: 30, left: 20, bottom: 20 },
}: ReusableChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(51,123,255,0.08)";

  const renderChart = () => {
    switch (chartType) {
      case "Area":
        return (
          <AreaChart data={data} margin={margin} style={{ outline: "none" }}>
            <defs>
              <linearGradient id="reusableAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "#94a3b8",
                fontSize: 10,
                angle: data.length > 15 ? -45 : 0,
                textAnchor: data.length > 15 ? "end" : "middle",
              }}
              height={data.length > 15 ? 45 : 30}
              dy={data.length > 15 ? 5 : 10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(val) => val === 0 ? "Tk0.00" : `$${val.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                borderRadius: "8px",
                color: isDark ? "#f8fafc" : "#0f172a",
              }}
              formatter={(value) => [`$${Number(value || 0).toLocaleString()}`, "Value"]}
            />
            <Area
              type="monotone"
              dataKey={lineValueKey}
              stroke="#3b82f6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#reusableAreaGrad)"
            />
          </AreaChart>
        );
      case "Line":
        return (
          <LineChart data={data} margin={margin} style={{ outline: "none" }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "#94a3b8",
                fontSize: 10,
                angle: data.length > 15 ? -45 : 0,
                textAnchor: data.length > 15 ? "end" : "middle",
              }}
              height={data.length > 15 ? 45 : 30}
              dy={data.length > 15 ? 5 : 10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(val) => val === 0 ? "Tk0.00" : `$${val.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                borderRadius: "8px",
                color: isDark ? "#f8fafc" : "#0f172a",
              }}
              formatter={(value) => [`$${Number(value || 0).toLocaleString()}`, "Value"]}
            />
            <Line
              type="monotone"
              dataKey={lineValueKey}
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 4, stroke: "#3b82f6", strokeWidth: 2.5, fill: "white" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
      case "Bar":
        return (
          <BarChart data={data} margin={margin} style={{ outline: "none" }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "#94a3b8",
                fontSize: 10,
                angle: data.length > 15 ? -45 : 0,
                textAnchor: data.length > 15 ? "end" : "middle",
              }}
              height={data.length > 15 ? 45 : 30}
              dy={data.length > 15 ? 5 : 10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(val) => val === 0 ? "Tk0.00" : `$${val.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                borderRadius: "8px",
                color: isDark ? "#f8fafc" : "#0f172a",
              }}
              formatter={(value, name) => [`$${Number(value || 0).toLocaleString()}`, String(name)]}
            />
            {bars.map((bar) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.name}
                stackId="a"
                fill={bar.color}
                opacity={bar.opacity}
              />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
}
