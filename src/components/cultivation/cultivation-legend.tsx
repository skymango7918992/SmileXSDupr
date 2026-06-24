import {
  ALL_CULTIVATION_TIERS,
  formatWinRateRequirement,
  formatWinsRequirement,
} from "@/lib/cultivation-tiers";
import { CultivationAvatar } from "@/components/cultivation/cultivation-avatar";
import { cn } from "@/lib/utils";

function TierAvatars({ level, size }: { level: number; size: number }) {
  if (level === 0) {
    return <CultivationAvatar tier={ALL_CULTIVATION_TIERS[0]} size={size} />;
  }

  const tier = ALL_CULTIVATION_TIERS.find((t) => t.level === level)!;

  return (
    <div className="flex shrink-0 items-end justify-center gap-3 sm:gap-4">
      <div className="flex flex-col items-center gap-1">
        <CultivationAvatar tier={tier} gender="male" size={size} />
        <span className="text-[10px] font-medium text-muted">男生</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <CultivationAvatar tier={tier} gender="female" size={size} />
        <span className="text-[10px] font-medium text-muted">女生</span>
      </div>
    </div>
  );
}

export function CultivationLegend() {
  return (
    <section className="glass-card p-4 sm:p-6">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        修行境界一覽
      </h3>
      <p className="mb-4 text-sm text-muted">
        星鑽 XS 與協會共用境界；左為男生／女生境界圖，右為晉升條件與詩白。球員未設定性別或仍為凡人時，顯示預設頭像。
      </p>
      <ul className="grid gap-4">
        {ALL_CULTIVATION_TIERS.map((tier) => (
          <li
            key={tier.level}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-3 py-4 sm:flex-row sm:items-start sm:gap-4"
          >
            <TierAvatars level={tier.level} size={tier.level === 0 ? 64 : 72} />
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
