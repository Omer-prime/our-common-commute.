"use client";

import React from "react";

export type RidesPoint = { date: string; value: number };
export type RevenuePoint = { date: string; valueCents: number };

function maxNum(nums: number[]) {
  return nums.length ? Math.max(...nums) : 0;
}

export function RidesOverviewChart({ data }: { data: RidesPoint[] }) {
  const values = data.map((d) => d.value);
  const maxV = Math.max(1, maxNum(values));

  return (
    <div className="w-full">
      <div className="flex items-end gap-2 h-[180px]">
        {data.map((d) => {
          const h = Math.round((d.value / maxV) * 160);
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
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
  );
}

export function RevenueOverviewChart({ data }: { data: RevenuePoint[] }) {
  const values = data.map((d) => d.valueCents);
  const maxV = Math.max(1, maxNum(values));

  const w = 520;
  const h = 180;
  const pad = 18;

  const points = data.map((d, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
    const y = h - pad - (d.valueCents / maxV) * (h - pad * 2);
    return { x, y, d };
  });

  const dPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[180px]">
        <path d={dPath} fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-400" />
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

      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
        {data.map((d) => (
          <span key={d.date}>{d.date.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}
