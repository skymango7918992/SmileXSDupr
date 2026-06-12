import { BADGE_TIERS } from "@/lib/badges";
import { BadgeMedal } from "./badge-medal";

export function BadgeLegend() {
  return (
    <section className="glass-card p-4 sm:p-6">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        勳章等級一覽
      </h3>
      <p className="mb-4 text-sm text-muted">累積勝場達標即可解鎖對應勳章</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {BADGE_TIERS.map((tier) => (
          <div
            key={tier.level}
            className="flex flex-col items-center rounded-[12px] border border-border bg-surface-muted/25 p-3 text-center"
          >
            <BadgeMedal wins={tier.minWins} size="lg" />
            <p className="mt-2 text-sm font-medium text-foreground">
              {tier.name}
            </p>
            <p className="text-xs font-medium text-primary">{tier.minWins} 勝</p>
            <p className="mt-1 text-[10px] leading-snug text-muted">
              {tier.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
