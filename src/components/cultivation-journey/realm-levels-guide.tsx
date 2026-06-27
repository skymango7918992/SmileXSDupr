"use client";

import { CultivationRealmPortrait } from "@/components/cultivation-journey/cultivation-realm-portrait";
import {
  getEffectiveJourneyRealmLevel,
  getJourneyRealm,
  getJourneyRealmLevelByXp,
  JOURNEY_EMPEROR_MIN_DUPR,
  JOURNEY_REALM_TIERS,
} from "@/lib/cultivation-journey-tiers";
import type { PlayerAvatarGender } from "@/lib/cultivation-tiers";
import { formatDuprRating } from "@/lib/player-display";
import { cn } from "@/lib/utils";

type Props = {
  totalXp: number;
  avatarGender: PlayerAvatarGender | null;
  duprRating: number | null;
};

export function RealmLevelsGuide({ totalXp, avatarGender, duprRating }: Props) {
  const currentTier = getJourneyRealm(totalXp, duprRating);
  const currentLevel = getEffectiveJourneyRealmLevel(totalXp, duprRating);
  const xpLevel = getJourneyRealmLevelByXp(totalXp);

  return (
    <details className="cj-guide group cj-realm-guide">
      <summary className="cj-realm-guide-summary">
        <span className="flex min-w-0 items-center gap-2.5">
          <CultivationRealmPortrait
            tier={currentTier}
            gender={avatarGender}
            size={40}
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[var(--cj-emerald)]">
              修行境界與修為門檻
            </span>
            <span className="mt-0.5 block truncate text-xs cj-muted">
              目前 {currentTier.name} · 修為 {totalXp.toLocaleString()} · 點擊展開
            </span>
          </span>
        </span>
        <span className="cj-guide-chevron shrink-0" aria-hidden>
          ▼
        </span>
      </summary>

      <p className="cj-guide-row mb-2 mt-2 text-xs sm:text-[0.6875rem]">
        累積修為達門檻即可突破境界。DUPR 天榜勝場有<strong>關鍵加分</strong>
        ，友誼切磋修為較少。目前修為：<strong>{totalXp.toLocaleString()}</strong>
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
                <CultivationRealmPortrait
                  tier={tier}
                  gender={avatarGender}
                  size={44}
                  className={cn(
                    "mt-0.5",
                    state === "upcoming" && "opacity-90",
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
                    <span className="tabular-nums cj-muted">
                      ≥ {tier.minXp.toLocaleString()} 修為
                    </span>
                    {idx > 0 && (
                      <span className="text-[10px] cj-faint">本階 +{delta.toLocaleString()}</span>
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
                  {tier.level === 10 && (
                    <p className="mt-1 text-[10px] font-semibold text-amber-800">
                      封大帝另需 DUPR ≥ {JOURNEY_EMPEROR_MIN_DUPR}
                      {duprRating != null && (
                        <span className="font-normal cj-muted">
                          {" "}
                          （目前 {formatDuprRating(duprRating)}）
                        </span>
                      )}
                    </p>
                  )}
                  {state === "upcoming" && tier.level === currentLevel + 1 && (
                    <p className="mt-1 text-[10px] font-medium cj-emerald">
                      突破條件：累積修為 ≥ {tier.minXp.toLocaleString()}
                      {totalXp < tier.minXp && (
                        <span>（還差 {(tier.minXp - totalXp).toLocaleString()}）</span>
                      )}
                      {tier.level === 10 && totalXp >= tier.minXp && (
                        <span>
                          {" "}
                          · 待 DUPR 達 {JOURNEY_EMPEROR_MIN_DUPR}
                        </span>
                      )}
                    </p>
                  )}
                  {state === "current" && tier.level === 9 && xpLevel >= 10 && (
                    <p className="mt-1 text-[10px] font-medium text-amber-800">
                      修為已達大帝門檻，待 DUPR 破 {JOURNEY_EMPEROR_MIN_DUPR} 即可封大帝
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="cj-guide-row mt-2 space-y-1 text-[10px] cj-faint">
        <p>修為來源：閉關練球、友誼切磋、天榜試煉、DUPR 匯入對戰（關鍵加分）</p>
        <p>
          DUPR 勝 +55／敗 +27 · 友誼勝 +10／敗 +11 · 閉關 10～25
        </p>
      </div>
    </details>
  );
}
