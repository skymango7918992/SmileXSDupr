"use client";

import { getCultivationImageSrc } from "@/lib/cultivation-tiers";
import { getJourneyRealmProgress } from "@/lib/cultivation-journey-tiers";

type Props = {
  totalXp: number;
  recordCount: number;
};

export function RealmProgressCard({ totalXp, recordCount }: Props) {
  const { current, next, xpIntoTier, xpNeeded, percent } =
    getJourneyRealmProgress(totalXp);
  const imageSrc = getCultivationImageSrc(current.level, "male");

  return (
    <section className="cj-realm-card overflow-hidden sm:p-5">
      <div className="flex gap-4">
        <div className="shrink-0">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl ring-2 ring-amber-400/50 sm:h-24 sm:w-24">
            <img
              src={imageSrc}
              alt={current.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest cj-gold">
            當前境界
          </p>
          <h2 className="text-xl font-bold leading-tight sm:text-2xl">
            {current.name}
            <span className="ml-2 text-sm font-medium cj-emerald">
              {current.subtitle}
            </span>
          </h2>
          <p className="mt-1 text-xs leading-relaxed cj-muted sm:text-sm">
            {current.tagline}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
          <span className="font-semibold cj-gold">修為 {totalXp}</span>
          {next ? (
            <span className="cj-muted">距 {next.name} 還需 {next.minXp - totalXp}</span>
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
          <p className="mt-1.5 text-[11px] cj-muted">
            下一境界「{next.name}」需累積 {next.minXp} 修為（本階 {xpIntoTier}/{xpNeeded}）
          </p>
        )}
      </div>

      <p className="mt-3 text-[11px] cj-faint">
        已留下 {recordCount} 筆修行紀錄 · 不為證明多強，只為看見自己一路走來
      </p>
    </section>
  );
}
