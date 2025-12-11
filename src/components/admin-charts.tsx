// src/components/admin-charts.tsx
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

/* -------------------------------------------------------------------------- */
/*  MOCK DATA                                                                 */
/* -------------------------------------------------------------------------- */

type RidePoint = { day: string; value: number };
const ridesData: RidePoint[] = [
  { day: "Mon", value: 380 },
  { day: "Tue", value: 560 },
  { day: "Wed", value: 820 },
  { day: "Thu", value: 430 },
  { day: "Fri", value: 610 },
  { day: "Sat", value: 520 },
];

type RevenuePoint = { day: string; value: number; active?: boolean };
const revenueData: RevenuePoint[] = [
  { day: "Mon", value: 3600 },
  { day: "Tue", value: 4100 },
  { day: "Wed", value: 5000, active: true },
  { day: "Thu", value: 4400 },
  { day: "Fri", value: 3900 },
  { day: "Sat", value: 2800 },
];

// Payments chart data (can be replaced later with backend data)
export type PaymentPoint = { month: string; value: number };

const paymentData: PaymentPoint[] = [
  { month: "Jan", value: 90000 },
  { month: "Feb", value: 7000 },
  { month: "Mar", value: 20000 },
  { month: "Apr", value: 15000 },
  { month: "May", value: 28000 },
  { month: "Jun", value: 5000 },
  { month: "Jul", value: 55000 },
  { month: "Aug", value: 8000 },
  { month: "Sep", value: 52000 },
  { month: "Oct", value: 50000 },
  { month: "Nov", value: 100000 },
  { month: "Dec", value: 40000 },
];

const axisTickStyle = { fontSize: 10, fill: "#94A3B8" };

/* -------------------------------------------------------------------------- */
/*  DASHBOARD CHARTS                                                          */
/* -------------------------------------------------------------------------- */

export function RidesOverviewChart() {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={ridesData}
          margin={{ top: 10, right: 18, left: -24, bottom: 0 }}
        >
          <defs>
            <linearGradient id="ridesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563FF" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2563FF" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="#E5EDFF"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={axisTickStyle}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={axisTickStyle}
            tickFormatter={(v) => v}
            width={32}
          />
          <Tooltip
            cursor={{ stroke: "#BFDBFE", strokeWidth: 2 }}
            contentStyle={{
              borderRadius: 8,
              borderColor: "#E5EDFF",
              fontSize: 11,
            }}
            labelStyle={{ fontWeight: 500 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#2563FF"
            strokeWidth={2.2}
            fill="url(#ridesGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueOverviewChart() {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={revenueData}
          margin={{ top: 10, right: 10, left: -24, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#E5EDFF"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={axisTickStyle}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={axisTickStyle}
            tickFormatter={(v) => `$${v / 1000}k`}
            width={40}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              borderColor: "#E5EDFF",
              fontSize: 11,
            }}
            labelStyle={{ fontWeight: 500 }}
          />
          <Bar
            dataKey="value"
            radius={[6, 6, 0, 0]}
            maxBarSize={36}
            background={false}
          >
            {revenueData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.active ? "#2563FF" : "#E0E7FF"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PAYMENTS / TOTAL TRANSACTION OVERVIEW CHART                               */
/* -------------------------------------------------------------------------- */

export function PaymentOverviewChart({
  data = paymentData,
}: {
  data?: PaymentPoint[];
}) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 18, left: -24, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id="paymentsGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#2563FF" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2563FF" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="#E5EDFF"
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={axisTickStyle}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={axisTickStyle}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            width={40}
          />

          <Tooltip
            cursor={{ stroke: "#BFDBFE", strokeWidth: 2 }}
            contentStyle={{
              borderRadius: 8,
              borderColor: "#E5EDFF",
              fontSize: 11,
            }}
            labelStyle={{ fontWeight: 500 }}
            formatter={(value: number | string) => {
              const num = Number(value);
              return [`$${num.toLocaleString()}`, "Total"];
            }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#2563FF"
            strokeWidth={2.2}
            fill="url(#paymentsGradient)"
            dot={{ r: 3.5, strokeWidth: 2, stroke: "#FFFFFF" }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
