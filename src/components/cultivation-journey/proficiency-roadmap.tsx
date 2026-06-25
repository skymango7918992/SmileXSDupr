"use client";

import {
  getNextProficiencyTarget,
  getProficiencyLevel,
  getProficiencyLevelMeta,
  PROFICIENCY_LEVELS,
  type ProficiencyLevelKey,
} from "@/lib/pickleball-techniques";
import { cn } from "@/lib/utils";

type Props = {
  score: number;
  compact?: boolean;
};

export function ProficiencyRoadmap({ score, compact = false }: Props) {
  const current = getProficiencyLevel(score);
  const target = getNextProficiencyTarget(score);

  if (compact) {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-slate-900/40 px-3 py-2">
        {target.nextLevel != null ? (
          <p className="text-[11px] text-emerald-100">
            下一目標：
            <span className="font-semibold text-amber-200">
              {getProficiencyLevelMeta(target.nextLevel).name}
            </span>
            （{target.nextThreshold} 分）· 還差{" "}
            <span className="font-bold tabular-nums">{target.pointsToNext}</span> 點
          </p>
        ) : (
          <p className="text-[11px] font-semibold text-amber-200">已達圓滿，此功法修至極境</p>
        )}
      </div>
    );
  }

  const currentIdx = PROFICIENCY_LEVELS.findIndex((l) => l.key === current);

  return (
    <div className="space-y-3">
      {target.nextLevel != null && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <p className="text-xs font-bold text-amber-900">修行目標</p>
          <p className="mt-0.5 text-sm text-amber-950">
            熟練度達 <span className="font-bold tabular-nums">{target.nextThreshold}</span> 分
            ，突破至「{getProficiencyLevelMeta(target.nextLevel).name}」
          </p>
          <p className="mt-1 text-xs text-amber-800">
            目前 {score} 分，還需{" "}
            <span className="font-bold tabular-nums">{target.pointsToNext}</span> 點
          </p>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold text-muted">功法階級路線</p>
        <ol className="space-y-1.5">
          {PROFICIENCY_LEVELS.map((level, idx) => {
            const state: "done" | "current" | "upcoming" =
              idx < currentIdx ? "done" : idx === currentIdx ? "current" : "upcoming";

            return (
              <li
                key={level.key}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs",
                  state === "done" && "border-emerald-500/20 bg-emerald-500/5",
                  state === "current" &&
                    "border-amber-500/40 bg-amber-500/10 ring-1 ring-amber-500/20",
                  state === "upcoming" && "border-border bg-surface-muted/30 opacity-70",
                )}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span
                    className={cn(
                      "font-bold",
                      state === "current" && "text-amber-900",
                      state === "done" && "text-emerald-800",
                    )}
                  >
                    {level.name}
                  </span>
                  <span className="tabular-nums text-muted">
                    {level.min}～{level.max} 分
                  </span>
                  {state === "current" && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                      目前
                    </span>
                  )}
                  {state === "done" && (
                    <span className="text-[10px] text-emerald-700">已達成</span>
                  )}
                </div>
                <p className="mt-0.5 text-muted">{level.description}</p>
                {state === "upcoming" && idx === currentIdx + 1 && (
                  <p className="mt-1 text-[10px] font-medium text-primary">
                    突破條件：熟練度 ≥ {level.min} 分
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export function ProficiencyLevelGuide() {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-slate-900/50 p-3">
      <p className="mb-2 text-xs font-semibold text-emerald-100">功法階級與突破條件</p>
      <div className="grid gap-1 sm:grid-cols-2">
        {PROFICIENCY_LEVELS.map((level) => (
          <div key={level.key} className="text-[10px] leading-snug text-slate-300">
            <span className="font-bold text-amber-200">{level.name}</span>
            <span className="ml-1 tabular-nums text-slate-400">
              {level.min}～{level.max} 分
            </span>
            <span className="text-slate-500"> · {level.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function proficiencyLevelLabel(level: ProficiencyLevelKey | string): string {
  return getProficiencyLevelMeta(level as ProficiencyLevelKey).name;
}
