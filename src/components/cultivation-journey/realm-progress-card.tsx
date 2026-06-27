"use client";

import { getCultivationImageSrc } from "@/lib/cultivation-tiers";
import type { PlayerAvatarGender } from "@/lib/cultivation-tiers";
import { getJourneyRealmProgress } from "@/lib/cultivation-journey-tiers";

type Props = {
  totalXp: number;
  recordCount: number;
  avatarGender: PlayerAvatarGender | null;
};

export function RealmProgressCard({
  totalXp,
  recordCount,
  avatarGender,
}: Props) {
  const { current, next, xpIntoTier, xpNeeded, percent } =
    getJourneyRealmProgress(totalXp);
  const imageSrc = getCultivationImageSrc(current.level, avatarGender);

  return (
    <section className="cj-realm-card overflow-hidden">
      <div className="flex gap-3 sm:gap-4">
        <div className="shrink-0">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl ring-2 ring-emerald-200 sm:h-24 sm:w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={current.name}
              className="h-full w-full object-contain"
            />
          </div>
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
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex flex-col gap-1 text-xs sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
          <span className="font-semibold cj-gold">修為 {totalXp}</span>
          {next ? (
            <span className="cj-muted text-pretty">
              距 {next.name} 還需 {next.minXp - totalXp}
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
        {next && (
          <p className="mt-1.5 text-[11px] cj-muted text-pretty">
            下一境界「{next.name}」需累積 {next.minXp} 修為（本階 {xpIntoTier}/{xpNeeded}）
          </p>
        )}
      </div>

      <p className="mt-3 text-[11px] cj-faint text-pretty">
        已留下 {recordCount} 筆修行紀錄 · 不為證明多強，只為看見自己一路走來
      </p>
    </section>
  );
}
