import { BADGE_TIERS } from "@/lib/badges";
import { BadgeMedal } from "./badge-medal";

export function BadgeLegend() {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/75 p-4 shadow-sm backdrop-blur-xl sm:p-6">
      <h3 className="mb-1 text-base font-bold text-slate-900">勳章等級一覽</h3>
      <p className="mb-4 text-sm text-slate-500">累積勝場達標即可解鎖對應勳章</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {BADGE_TIERS.map((tier) => (
          <div
            key={tier.level}
            className="flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-center"
          >
            <BadgeMedal wins={tier.minWins} size="lg" />
            <p className="mt-2 text-sm font-semibold text-slate-800">{tier.name}</p>
            <p className="text-xs font-medium text-emerald-700">{tier.minWins} 勝</p>
            <p className="mt-1 text-[10px] leading-snug text-slate-500">
              {tier.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
