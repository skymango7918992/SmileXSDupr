"use client";

import { useState, useTransition } from "react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { updateCultivationDemons } from "@/lib/actions/cultivation-journey";
import {
  skillLevelFromXp,
  skillProgressPercent,
} from "@/lib/cultivation-journey-xp";
import {
  CULTIVATION_DEMONS,
  CULTIVATION_SKILLS,
  type CultivationDemonId,
  type CultivationProfile,
} from "@/types/cultivation-journey";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

type Props = {
  profile: CultivationProfile;
};

export function SkillsDemonsPanel({ profile }: Props) {
  const [activeDemons, setActiveDemons] = useState<CultivationDemonId[]>(
    (profile.active_demons ?? []) as CultivationDemonId[],
  );
  const [conqueredDemons, setConqueredDemons] = useState<CultivationDemonId[]>(
    (profile.conquered_demons ?? []) as CultivationDemonId[],
  );
  const [isPending, startTransition] = useTransition();
  const { success, error: toastError } = useAppUi();

  const toggleActive = (id: CultivationDemonId) => {
    if (conqueredDemons.includes(id)) return;
    setActiveDemons((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const toggleConquered = (id: CultivationDemonId) => {
    if (conqueredDemons.includes(id)) {
      setConqueredDemons((prev) => prev.filter((d) => d !== id));
      return;
    }
    setConqueredDemons((prev) => [...prev, id]);
    setActiveDemons((prev) => prev.filter((d) => d !== id));
  };

  const save = () => {
    startTransition(async () => {
      try {
        await updateCultivationDemons({
          active_demons: activeDemons,
          conquered_demons: conqueredDemons,
        });
        success("心魔清單已更新");
      } catch (e) {
        toastError(e instanceof Error ? e.message : "儲存失敗");
      }
    });
  };

  const dirty =
    JSON.stringify(activeDemons) !== JSON.stringify(profile.active_demons) ||
    JSON.stringify(conqueredDemons) !== JSON.stringify(profile.conquered_demons);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardTitle className="mb-3 text-base">功法熟練度</CardTitle>
        <p className="mb-3 text-xs text-muted">
          閉關時勾選的功法各 +5 熟練度，十級為大成。
        </p>
        <ul className="space-y-3">
          {CULTIVATION_SKILLS.map((skill) => {
            const xp = profile.skill_xp?.[skill.id] ?? 0;
            const level = skillLevelFromXp(xp);
            const pct = skillProgressPercent(xp);
            return (
              <li key={skill.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">{skill.label}</span>
                  <span className="text-xs text-muted">
                    Lv.{level} · {xp} 熟練
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[10px] text-muted">{skill.hint}</p>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <CardTitle className="text-base">心魔清單</CardTitle>
          <Button size="sm" loading={isPending} disabled={!dirty} onClick={save}>
            儲存
          </Button>
        </div>
        <p className="mb-3 text-xs text-muted">
          標記正在對抗的心魔，破魔後可勾選「已降伏」。
        </p>
        <ul className="space-y-2">
          {CULTIVATION_DEMONS.map((demon) => {
            const active = activeDemons.includes(demon.id);
            const conquered = conqueredDemons.includes(demon.id);
            return (
              <li
                key={demon.id}
                className={cn(
                  "rounded-xl border px-3 py-2.5",
                  conquered
                    ? "border-emerald-500/30 bg-emerald-500/5 opacity-80"
                    : active
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{demon.label}</p>
                    <p className="text-xs text-muted">{demon.description}</p>
                    <p className="mt-1 text-[11px] text-primary/80">
                      破魔：{demon.counter}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      disabled={conquered}
                      onClick={() => toggleActive(demon.id)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[10px] font-semibold",
                        active
                          ? "bg-amber-500/20 text-amber-900"
                          : "bg-surface-muted text-muted",
                      )}
                    >
                      {active ? "對抗中" : "標記"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleConquered(demon.id)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[10px] font-semibold",
                        conquered
                          ? "bg-emerald-500/20 text-emerald-800"
                          : "bg-surface-muted text-muted",
                      )}
                    >
                      {conquered ? "已降伏" : "破魔"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
