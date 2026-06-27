"use client";

import { CultivationRealmPortrait } from "@/components/cultivation-journey/cultivation-realm-portrait";
import type { PlayerAvatarGender } from "@/lib/cultivation-tiers";
import {
  getJourneyRealmProgress,
  JOURNEY_EMPEROR_MIN_DUPR,
  JOURNEY_EMPEROR_MIN_XP,
} from "@/lib/cultivation-journey-tiers";
import { formatDuprRating } from "@/lib/player-display";

type Props = {
  totalXp: number;
  recordCount: number;
  avatarGender: PlayerAvatarGender | null;
  duprRating: number | null;
};

export function RealmProgressCard({
  totalXp,
  recordCount,
  avatarGender,
  duprRating,
}: Props) {
  const progress = getJourneyRealmProgress(totalXp, duprRating);
  const {
    current,
    next,
    xpIntoTier,
    xpNeeded,
    percent,
    emperorXpReady,
    emperorDuprReady,
  } = progress;
  const emperorBlocked = emperorXpReady && !emperorDuprReady;

  return (
    <section className="cj-realm-card overflow-hidden">
      <div className="flex gap-3 sm:gap-4">
        <div className="h-16 w-16 shrink-0 sm:h-24 sm:w-24">
          <CultivationRealmPortrait
            tier={current}
            gender={avatarGender}
            fill
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest cj-gold">
            當前境界
          </p>
          <h2 className="text-lg font-bold leading-tight sm:text-2xl">
            {current.name}
            <span className="mt-0.5 block text-sm font-medium cj-emerald sm:ml-2 sm:mt-0 sm:inline">
              {current.subtitle}
            </span>
          </h2>
          <p className="mt-1 text-xs leading-relaxed cj-muted text-pretty sm:text-sm">
            {current.tagline}
          </p>
          {duprRating != null && (
            <p className="mt-1.5 text-[11px] cj-muted">
              DUPR 評分{" "}
              <strong className="cj-gold">{formatDuprRating(duprRating)}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex flex-col gap-1 text-xs sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
          <span className="font-semibold cj-gold">修為 {totalXp.toLocaleString()}</span>
          {emperorBlocked ? (
            <span className="text-pretty font-medium text-amber-700">
              修為已足，待 DUPR ≥ {JOURNEY_EMPEROR_MIN_DUPR} 封大帝
            </span>
          ) : next ? (
            <span className="cj-muted text-pretty">
              距 {next.name} 還需 {(next.minXp - totalXp).toLocaleString()}
            </span>
          ) : (
            <span className="cj-gold">已達球道之巔</span>
          )}
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full"
          style={{ background: "var(--cj-track)" }}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        {emperorBlocked && (
          <p className="mt-1.5 text-[11px] text-pretty text-amber-800">
            大帝需修為 ≥ {JOURNEY_EMPEROR_MIN_XP.toLocaleString()} 且 DUPR ≥
            {JOURNEY_EMPEROR_MIN_DUPR}（目前{" "}
            {duprRating != null ? formatDuprRating(duprRating) : "未設定"}）
          </p>
        )}
        {next && !emperorBlocked && (
          <p className="mt-1.5 text-[11px] cj-muted text-pretty">
            下一境界「{next.name}」需累積 {next.minXp.toLocaleString()} 修為（本階{" "}
            {xpIntoTier.toLocaleString()}/{xpNeeded.toLocaleString()}）
            {next.level === 10 && (
              <span>
                {" "}
                · 另需 DUPR ≥ {JOURNEY_EMPEROR_MIN_DUPR}
              </span>
            )}
          </p>
        )}
      </div>

      <p className="mt-3 text-[11px] cj-faint text-pretty">
        已留下 {recordCount} 筆修行紀錄 · DUPR 天榜勝場為關鍵修為來源
      </p>
    </section>
  );
}
