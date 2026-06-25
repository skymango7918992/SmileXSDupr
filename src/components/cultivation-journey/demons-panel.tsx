"use client";

import { useState, useTransition } from "react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { updateCultivationDemons } from "@/lib/actions/cultivation-journey";
import {
  CULTIVATION_DEMONS,
  type CultivationDemonId,
  type CultivationProfile,
} from "@/types/cultivation-journey";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

type Props = {
  profile: CultivationProfile;
};

export function DemonsPanel({ profile }: Props) {
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
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <CardTitle className="text-base">心魔清單</CardTitle>
        <Button size="sm" loading={isPending} disabled={!dirty} onClick={save}>
          儲存
        </Button>
      </div>
      <p className="mb-3 text-xs text-muted">
        標記正在對抗的心魔，破魔後可勾選「已降伏」。（後續擴充項目）
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
  );
}
