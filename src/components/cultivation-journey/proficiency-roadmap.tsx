"use client";

import { useEffect, useState } from "react";
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
      <div className="cj-guide">
        {target.nextLevel != null ? (
          <p className="cj-guide-row text-xs sm:text-[0.6875rem]">
            下一目標：
            <strong>{getProficiencyLevelMeta(target.nextLevel).name}</strong>
            （{target.nextThreshold} 分）· 還差{" "}
            <strong>{target.pointsToNext}</strong> 點
          </p>
        ) : (
          <p className="cj-guide-row text-xs sm:text-[0.6875rem]">
            <strong>已達圓滿</strong>，此功法修至極境
          </p>
        )}
      </div>
    );
  }

  const currentIdx = PROFICIENCY_LEVELS.findIndex((l) => l.key === current);

  return (
    <div className="space-y-3">
      {target.nextLevel != null && (
        <div className="cj-roadmap-target">
          <p className="text-xs font-bold cj-gold">修行目標</p>
          <p className="mt-0.5 text-sm text-pretty">
            熟練度達 <b>{target.nextThreshold}</b> 分，突破至「
            {getProficiencyLevelMeta(target.nextLevel).name}」
          </p>
          <p className="mt-1 text-xs cj-muted">
            目前 {score} 分，還需 <b>{target.pointsToNext}</b> 點
          </p>
        </div>
      )}

      <div>
        <p className="cj-section-title mb-2">功法階級路線</p>
        <ol className="space-y-1.5">
          {PROFICIENCY_LEVELS.map((level, idx) => {
            const state: "done" | "current" | "upcoming" =
              idx < currentIdx ? "done" : idx === currentIdx ? "current" : "upcoming";

            return (
              <li
                key={level.key}
                className={cn(
                  "cj-roadmap-item",
                  state === "done" && "is-done",
                  state === "current" && "is-current",
                  state === "upcoming" && "is-upcoming",
                )}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="level-name">{level.name}</span>
                  <span className="tabular-nums cj-muted">
                    {level.min}～{level.max} 分
                  </span>
                  {state === "current" && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      目前
                    </span>
                  )}
                  {state === "done" && (
                    <span className="text-[10px] cj-emerald">已達成</span>
                  )}
                </div>
                <p className="mt-0.5 text-pretty cj-muted">{level.description}</p>
                {state === "upcoming" && idx === currentIdx + 1 && (
                  <p className="mt-1 text-[10px] font-medium cj-emerald">
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
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <details
      className={cn("cj-guide group", desktop && "cj-guide--desktop-open")}
      open={desktop}
    >
      <summary className="cj-guide-title">
        <span>功法階級與突破條件</span>
        <span className="cj-guide-chevron lg:hidden" aria-hidden>
          ▼
        </span>
      </summary>
      <div className="mt-2 grid gap-1 sm:grid-cols-2">
        {PROFICIENCY_LEVELS.map((level) => (
          <div key={level.key} className="cj-guide-row text-xs sm:text-[0.6875rem]">
            <strong>{level.name}</strong>
            <em className="ml-1 tabular-nums not-italic">
              {level.min}～{level.max} 分
            </em>
            <em className="not-italic"> · {level.description}</em>
          </div>
        ))}
      </div>
    </details>
  );
}

export function proficiencyLevelLabel(level: ProficiencyLevelKey | string): string {
  return getProficiencyLevelMeta(level as ProficiencyLevelKey).name;
}
