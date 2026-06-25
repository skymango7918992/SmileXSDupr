"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getTechniqueLogs } from "@/lib/actions/technique-practice";
import {
  proficiencyLevelLabel,
  ProficiencyRoadmap,
} from "@/components/cultivation-journey/proficiency-roadmap";
import {
  getNextProficiencyTarget,
  getProficiencyLevelMeta,
  getTechniqueById,
  getTechniqueLevelTitle,
} from "@/lib/pickleball-techniques";
import type { TechniqueLogWithSession, TechniqueProgress } from "@/types/technique-practice";

type Props = {
  techniqueId: string;
  progress: TechniqueProgress;
  onClose: () => void;
};

export function TechniqueDetailPanel({ techniqueId, progress, onClose }: Props) {
  const technique = getTechniqueById(techniqueId);
  const [logs, setLogs] = useState<TechniqueLogWithSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await getTechniqueLogs(techniqueId);
        setLogs(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [techniqueId]);

  if (!technique) return null;

  const levelMeta = getProficiencyLevelMeta(progress.proficiency_level);
  const levelTitle = getTechniqueLevelTitle(technique, progress.proficiency_level);
  const target = getNextProficiencyTarget(progress.proficiency_score);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <div className="glass-overlay absolute inset-0" aria-hidden onClick={onClose} />
      <div className="glass-modal relative flex max-h-[min(96dvh,100%)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface sm:max-h-[min(90dvh,720px)] sm:rounded-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-divider px-4 py-3">
          <div>
            <h3 className="text-base font-bold text-foreground">{technique.name}</h3>
            <p className="text-xs text-muted">{technique.shot} · {technique.category}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-touch rounded-lg p-2 text-muted hover:bg-surface-muted"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="mb-4 rounded-xl border border-amber-500/25 bg-gradient-to-br from-slate-900 to-emerald-950 p-3 text-white">
            <p className="text-xs text-amber-200/80">熟練度：{levelMeta.name} · {levelTitle}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{progress.proficiency_score} / 100</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-amber-400"
                style={{ width: `${progress.proficiency_score}%` }}
              />
            </div>
            {target.nextLevel != null && target.pointsToNext != null && (
              <p className="mt-1 text-[11px] text-slate-400">
                再 {target.pointsToNext} 點可達「
                {getProficiencyLevelMeta(target.nextLevel).name}」（{target.nextThreshold} 分）
              </p>
            )}
            <p className="mt-2 text-xs italic text-slate-300">{technique.quote}</p>
          </div>

          <div className="mb-4">
            <ProficiencyRoadmap score={progress.proficiency_score} />
          </div>

          <p className="mb-1 text-xs font-semibold text-muted">練習重點</p>
          <p className="mb-3 text-sm text-secondary-foreground">{technique.focus}</p>

          <div className="mb-4 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-lg border border-border bg-surface-muted/50 py-2">
              <p className="font-bold text-foreground">{progress.total_practice_count}</p>
              <p className="text-muted">累積閉關次數</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted/50 py-2">
              <p className="font-bold text-foreground">{progress.total_practice_minutes}</p>
              <p className="text-muted">累積分鐘</p>
            </div>
          </div>

          <h4 className="mb-2 text-sm font-semibold">歷史閉關紀錄</h4>
          {loading ? (
            <p className="text-sm text-muted">載入中…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted">尚無此功法的閉關紀錄</p>
          ) : (
            <ul className="space-y-2">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-lg border border-border px-3 py-2 text-xs"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{log.practice_date}</span>
                    <span className="text-muted">{log.location_name}</span>
                    <span className="text-primary">+{log.gained_exp}</span>
                    {log.is_level_up && (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-800">
                        突破 {proficiencyLevelLabel(log.before_level)} → {proficiencyLevelLabel(log.after_level)}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-muted">
                    {log.duration_minutes} 分鐘 · {log.before_score} → {log.after_score}
                  </p>
                  {log.session_note && (
                    <p className="mt-1 text-muted">{log.session_note}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
