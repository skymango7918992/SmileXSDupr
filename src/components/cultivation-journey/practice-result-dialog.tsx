"use client";

import { useEffect } from "react";
import {
  getNextProficiencyTarget,
  getTechniqueById,
  getProficiencyLevelMeta,
} from "@/lib/pickleball-techniques";
import type { CreatePracticeSessionResult } from "@/types/technique-practice";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

type Props = {
  result: CreatePracticeSessionResult;
  onClose: () => void;
};

export function PracticeResultDialog({ result, onClose }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const hasLevelUp = result.levelUps.length > 0;
  const firstGain = result.gainedPerTechnique[0];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center">
      <div className="glass-overlay absolute inset-0" aria-hidden onClick={onClose} />
      <Card className="glass-modal relative w-full max-w-md overflow-hidden rounded-t-2xl sm:rounded-2xl">
        <div className="border-b border-divider bg-gradient-to-r from-emerald-900/90 to-slate-900 px-4 py-4 text-white">
          <CardTitle className="text-lg text-amber-100">閉關完成！</CardTitle>
          <p className="text-xs text-slate-300">
            修為 +{result.realmXpEarned} · 功法熟練度已更新
          </p>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div>
            <p className="mb-2 text-sm font-semibold">本次修煉</p>
            <ul className="space-y-1 text-sm">
              {result.gainedPerTechnique.map((item) => (
                <li key={item.techniqueId} className="flex justify-between">
                  <span>{item.techniqueName}</span>
                  <span className="font-bold text-primary">+{item.gainedExp}</span>
                </li>
              ))}
            </ul>
          </div>

          {hasLevelUp ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3">
              <p className="mb-2 text-sm font-bold text-amber-900">功法突破</p>
              {result.levelUps.map((up) => (
                <p key={up.techniqueId} className="text-sm text-amber-950">
                  {up.techniqueName}：{up.beforeLevel} → {up.afterLevel}
                </p>
              ))}
              {result.levelUps[0] && (
                <p className="mt-2 text-xs italic text-amber-800">
                  {getTechniqueById(result.levelUps[0]!.techniqueId)?.quote}
                </p>
              )}
            </div>
          ) : (
            firstGain && (
              <div className="rounded-xl border border-border bg-surface-muted/40 px-3 py-3 text-sm">
                <p className="font-semibold">目前熟練度</p>
                {result.gainedPerTechnique.map((item) => {
                  const log = result.techniqueLogs.find(
                    (l) => l.technique_id === item.techniqueId,
                  );
                  const after = log?.after_score ?? 0;
                  const level = log?.after_level ?? "foundation";
                  const meta = getProficiencyLevelMeta(level);
                  const target = getNextProficiencyTarget(after);
                  return (
                    <p key={item.techniqueId} className="mt-1 text-secondary-foreground">
                      {item.techniqueName}｜{meta.name} {after} / 100
                      {target.nextLevel != null && target.pointsToNext != null && (
                        <span className="block text-xs text-muted">
                          再 {target.pointsToNext} 點可達「
                          {getProficiencyLevelMeta(target.nextLevel).name}」（
                          {target.nextThreshold} 分）
                        </span>
                      )}
                    </p>
                  );
                })}
              </div>
            )
          )}

          <Button onClick={onClose} className="w-full">
            繼續修行
          </Button>
        </div>
      </Card>
    </div>
  );
}
