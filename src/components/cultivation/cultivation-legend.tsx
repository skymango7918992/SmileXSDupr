import {
  CULTIVATION_DEFAULT,
  CULTIVATION_TIERS,
  formatWinRateRequirement,
  formatWinsRequirement,
} from "@/lib/cultivation-tiers";
import { CultivationMedal } from "@/components/cultivation/cultivation-medal";
import { cn } from "@/lib/utils";

export function CultivationLegend() {
  return (
    <section className="glass-card p-4 sm:p-6">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        修行境界一覽
      </h3>
      <p className="mb-4 text-sm text-muted">
        星鑽 XS 與協會共用境界；左為境界勳章、右為晉升條件與詩白
      </p>
      <ul className="grid gap-4">
        {[CULTIVATION_DEFAULT, ...CULTIVATION_TIERS].map((tier) => (
          <li
            key={tier.level}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-3 py-4 sm:flex-row sm:items-start sm:gap-4"
          >
            <CultivationMedal
              tier={tier}
              size={tier.level === 0 ? 64 : 88}
              className="shrink-0"
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              {tier.level === 0 ? (
                <p className={cn("text-sm font-semibold", tier.pillText)}>
                  {tier.name} · {tier.subtitle}
                </p>
              ) : (
                <>
                  <p className={cn("text-sm font-semibold", tier.pillText)}>
                    Lv.{tier.level} {tier.name} · {tier.subtitle}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-muted">
                    {formatWinsRequirement(tier)} · {formatWinRateRequirement(tier)}
                  </p>
                </>
              )}
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
                「{tier.tagline}」
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
