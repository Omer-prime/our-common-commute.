"use client";

import React from "react";

export type RidesPoint = { date: string; value: number };
export type RevenuePoint = { date: string; valueCents: number };

function maxNum(nums: number[]) {
  return nums.length ? Math.max(...nums) : 0;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-[180px] items-center justify-center rounded-xl bg-slate-50">
      <p className="text-[12px] text-slate-400">{text}</p>
    </div>
  );
}

/* ---------------- Rides (Bars) ---------------- */

export function RidesOverviewChart({ data }: { data: RidesPoint[] }) {
  if (!data.length) return <EmptyState text="No data yet." />;

  const values = data.map((d) => d.value);
  const maxV = maxNum(values);
  const allZero = maxV === 0;

  if (allZero) {
    return <EmptyState text="No rides recorded in the last 7 days." />;
  }

  // Visual sizes
  const chartH = 180; // total area we want
  const barsH = 150;  // height reserved for bars (rest for labels)

  return (
    <div className="w-full">
      <div className="relative h-[180px]">
        {/* subtle grid */}
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-white">
          <div className="absolute left-0 right-0 top-1/3 border-t border-slate-100" />
          <div className="absolute left-0 right-0 top-2/3 border-t border-slate-100" />
        </div>

        <div className="flex h-full items-end gap-2">
          {data.map((d) => {
            const h = Math.round((d.value / maxV) * barsH);

            return (
              <div
                key={d.date}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <div
                  className="w-full rounded-xl bg-slate-200"
                  style={{ height: `${h}px` }}
                  title={`${d.date}: ${d.value}`}
                />
                <div className="text-[10px] text-slate-400">
                  {d.date.slice(5)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Revenue (Line) ---------------- */

export function RevenueOverviewChart({ data }: { data: RevenuePoint[] }) {
  if (!data.length) return <EmptyState text="No data yet." />;

  const values = data.map((d) => d.valueCents);
  const maxV = maxNum(values);
  const allZero = maxV === 0;

  // We keep viewBox for correct scaling, but we DO NOT force min-width anymore
  const w = 520;
  const h = 180;
  const pad = 18;

  if (allZero) {
    return (
      <div className="w-full">
        <div className="relative h-[180px]">
          <div className="flex h-[180px] items-center justify-center rounded-xl bg-slate-50">
            <p className="text-[12px] text-slate-400">
              No revenue recorded in the last 7 days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const points = data.map((d, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
    const y = h - pad - (d.valueCents / maxV) * (h - pad * 2);
    return { x, y, d };
  });

  const dPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  return (
    <div className="w-full">
      <div className="relative">
        {/* chart */}
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[180px]">
          {/* subtle grid */}
          <path
            d={`M 0 ${h / 3} L ${w} ${h / 3} M 0 ${(h * 2) / 3} L ${w} ${(h * 2) / 3}`}
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-100"
          />

          <path
            d={dPath}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-slate-500"
          />

          {points.map((p) => (
            <circle
              key={p.d.date}
              cx={p.x}
              cy={p.y}
              r="4"
              className="fill-slate-300"
            >
              <title>
                {p.d.date}: ${(p.d.valueCents / 100).toFixed(2)}
              </title>
            </circle>
          ))}
        </svg>

        {/* labels (don’t overcrowd on mobile) */}
        <div className="mt-2 grid grid-cols-7 text-[10px] text-slate-400">
          {data.map((d, i) => (
            <span
              key={d.date}
              className={[
                "text-center whitespace-nowrap",
                // On mobile: show fewer labels (every other)
                i % 2 === 1 ? "hidden sm:block" : "",
              ].join(" ")}
            >
              {d.date.slice(5)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
