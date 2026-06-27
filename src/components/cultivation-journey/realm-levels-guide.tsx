"use client";

import { CultivationAvatar } from "@/components/cultivation/cultivation-avatar";
import {
  getJourneyRealm,
  JOURNEY_REALM_TIERS,
} from "@/lib/cultivation-journey-tiers";
import type { PlayerAvatarGender } from "@/lib/cultivation-tiers";
import { cn } from "@/lib/utils";

type Props = {
  totalXp: number;
  avatarGender: PlayerAvatarGender | null;
};

export function RealmLevelsGuide({ totalXp, avatarGender }: Props) {
  const currentTier = getJourneyRealm(totalXp);
  const currentLevel = currentTier.level;

  return (
    <details className="cj-guide group cj-realm-guide">
      <summary className="cj-realm-guide-summary">
        <span className="flex min-w-0 items-center gap-2.5">
          <CultivationAvatar
            tier={currentTier}
            gender={avatarGender}
            size={40}
            className="ring-2 ring-emerald-200/80"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[var(--cj-emerald)]">
              修行境界與修為門檻
            </span>
            <span className="mt-0.5 block truncate text-xs cj-muted">
              目前 {currentTier.name} · 修為 {totalXp} · 點擊展開全部境界
            </span>
          </span>
        </span>
        <span className="cj-guide-chevron shrink-0" aria-hidden>
          ▼
        </span>
      </summary>

      <p className="cj-guide-row mb-2 mt-2 text-xs sm:text-[0.6875rem]">
        累積修為達門檻即可突破境界。目前修為：<strong>{totalXp}</strong>
      </p>

      <ol className="space-y-1.5">
        {JOURNEY_REALM_TIERS.map((tier, idx) => {
          const prevMinXp = idx > 0 ? JOURNEY_REALM_TIERS[idx - 1]!.minXp : 0;
          const delta = tier.minXp - prevMinXp;
          const state: "done" | "current" | "upcoming" =
            tier.level < currentLevel
              ? "done"
              : tier.level === currentLevel
                ? "current"
                : "upcoming";

          return (
            <li
              key={tier.level}
              className={cn(
                "cj-roadmap-item",
                state === "done" && "is-done",
                state === "current" && "is-current",
                state === "upcoming" && "is-upcoming",
              )}
            >
              <div className="flex gap-2.5 sm:gap-3">
                <CultivationAvatar
                  tier={tier}
                  gender={avatarGender}
                  size={44}
                  className={cn(
                    "mt-0.5 ring-2",
                    state === "current" && "ring-amber-300/80",
                    state === "done" && "ring-emerald-200/80",
                    state === "upcoming" && "ring-[var(--cj-border-soft)] opacity-90",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="level-name">
                      {tier.name}
                      <span className="ml-1 font-normal cj-muted">
                        ({tier.subtitle})
                      </span>
                    </span>
                    <span className="tabular-nums cj-muted">≥ {tier.minXp} 修為</span>
                    {idx > 0 && (
                      <span className="text-[10px] cj-faint">本階 +{delta}</span>
                    )}
                    {state === "current" && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        目前
                      </span>
                    )}
                    {state === "done" && (
                      <span className="text-[10px] cj-emerald">已達成</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-pretty cj-muted">{tier.tagline}</p>
                  {state === "upcoming" && tier.level === currentLevel + 1 && (
                    <p className="mt-1 text-[10px] font-medium cj-emerald">
                      突破條件：累積修為 ≥ {tier.minXp}
                      {totalXp < tier.minXp && (
                        <span>（還差 {tier.minXp - totalXp}）</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="cj-guide-row mt-2 text-[10px] cj-faint">
        修為來源：閉關練球、同門切磋、天榜試煉（與 DUPR 勝場榜境界分開計算）
      </p>
    </details>
  );
}
