"use client";

import { useMemo, useState } from "react";
import {
  computeMonthlyChart,
  computeYearlyChart,
  getSessionYears,
  minutesToChartHours,
} from "@/lib/play-journey-charts";
import type { ChartBucket, PlaySession } from "@/types/play-journey";
import { cn } from "@/lib/utils";

type Mode = "month" | "year";

type Props = {
  sessions: PlaySession[];
};

export function PlayHoursChart({ sessions }: Props) {
  const years = useMemo(() => getSessionYears(sessions), [sessions]);
  const [mode, setMode] = useState<Mode>("month");
  const [year, setYear] = useState(() => new Date().getFullYear());

  const buckets: ChartBucket[] = useMemo(() => {
    if (mode === "year") return computeYearlyChart(sessions);
    return computeMonthlyChart(sessions, year);
  }, [mode, sessions, year]);

  const maxHours = useMemo(() => {
    const values = buckets.map((b) => minutesToChartHours(b.minutes));
    return Math.max(1, ...values);
  }, [buckets]);

  const totalHours = useMemo(
    () => minutesToChartHours(buckets.reduce((sum, b) => sum + b.minutes, 0)),
    [buckets],
  );

  return (
    <section className="glass-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">打球時數</h2>
          <p className="text-xs text-muted">
            {mode === "month" ? `${year} 年每月` : "歷年"}統計 · 合計{" "}
            <span className="font-data font-semibold text-primary">
              {totalHours}
            </span>{" "}
            小時
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="play-chart-toggle">
            <button
              type="button"
              className={cn(mode === "month" && "play-chart-toggle--active")}
              onClick={() => setMode("month")}
            >
              每月
            </button>
            <button
              type="button"
              className={cn(mode === "year" && "play-chart-toggle--active")}
              onClick={() => setMode("year")}
            >
              每年
            </button>
          </div>

          {mode === "month" && (
            <select
              className="rounded-[8px] border border-border bg-surface px-2 py-1.5 text-sm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y} 年
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {buckets.every((b) => b.minutes === 0) ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          還沒有資料，先紀錄幾次打球吧
        </p>
      ) : (
        <div
          className={cn(
            "play-chart-grid",
            mode === "month" ? "play-chart-grid--month" : "play-chart-grid--year",
          )}
        >
          {buckets.map((bucket) => {
            const hours = minutesToChartHours(bucket.minutes);
            const height = Math.max(6, (hours / maxHours) * 100);
            return (
              <div key={bucket.key} className="play-chart-bar-col">
                <div className="play-chart-bar-wrap">
                  <div
                    className="play-chart-bar"
                    style={{ height: `${height}%` }}
                    title={`${bucket.label}：${hours} 小時 · ${bucket.sessions} 場`}
                  >
                    {hours > 0 && (
                      <span className="play-chart-bar__value font-data">
                        {hours}
                      </span>
                    )}
                  </div>
                </div>
                <span className="play-chart-bar__label">{bucket.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
