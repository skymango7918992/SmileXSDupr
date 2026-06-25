"use client";

import {
  getProficiencyLevelMeta,
  getProficiencyLevelName,
  getTechniqueById,
  getTechniqueLevelTitle,
  pointsToNextProficiencyLevel,
  type PickleballTechnique,
} from "@/lib/pickleball-techniques";
import type { TechniqueProgress } from "@/types/technique-practice";
import { cn } from "@/lib/utils";

type Props = {
  progressList: TechniqueProgress[];
  onSelect: (techniqueId: string) => void;
};

export function TechniquesOverview({ progressList, onSelect }: Props) {
  const progressMap = new Map(progressList.map((p) => [p.technique_id, p]));

  const grouped = progressList.reduce<Record<string, TechniqueProgress[]>>(
    (acc, p) => {
      const technique = getTechniqueById(p.technique_id);
      const cat = technique?.category ?? "其他";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    },
    {},
  );

  const categories = Object.keys(grouped).sort();

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">我的閉關功法</h3>
        <p className="text-xs text-muted">
          16 項匹克球擊球功法 · 熟練度 0～100 · 小成／入微／大成／圓滿
        </p>
      </div>

      {categories.map((category) => (
        <section key={category}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary/80">
            {category}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {grouped[category]!.map((progress) => {
              const technique = getTechniqueById(progress.technique_id);
              if (!technique) return null;
              return (
                <TechniqueCard
                  key={progress.technique_id}
                  technique={technique}
                  progress={progressMap.get(progress.technique_id)!}
                  onClick={() => onSelect(progress.technique_id)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function TechniqueCard({
  technique,
  progress,
  onClick,
}: {
  technique: PickleballTechnique;
  progress: TechniqueProgress;
  onClick: () => void;
}) {
  const level = progress.proficiency_level;
  const levelMeta = getProficiencyLevelMeta(level);
  const levelTitle = getTechniqueLevelTitle(technique, level);
  const score = progress.proficiency_score;
  const toNext = pointsToNextProficiencyLevel(score);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "technique-jade-card btn-touch w-full rounded-xl border border-emerald-500/20",
        "bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-emerald-950/80 p-3 text-left text-white",
        "transition-shadow hover:shadow-md hover:ring-1 hover:ring-amber-400/30",
      )}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-amber-100">
            {technique.name}
          </p>
          <p className="truncate text-[10px] text-slate-400">{technique.shot}</p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
          {levelMeta.name}
        </span>
      </div>

      <p className="mb-2 text-[11px] text-emerald-200/90">稱號：{levelTitle}</p>

      <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-400"
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex items-baseline justify-between text-[10px] text-slate-400">
        <span>{score} / 100</span>
        {toNext != null && <span>再 {toNext} 點升階</span>}
        {toNext == null && <span className="text-amber-300">圓滿</span>}
      </div>

      {progress.last_practiced_at && (
        <p className="mt-1.5 text-[10px] text-slate-500">
          上次閉關：{progress.last_practiced_at.slice(0, 10)}
        </p>
      )}

      <p className="mt-2 line-clamp-2 text-[10px] italic leading-snug text-slate-400">
        {technique.quote}
      </p>
    </button>
  );
}

export function proficiencyLevelLabel(level: string): string {
  return getProficiencyLevelName(level as import("@/lib/pickleball-techniques").ProficiencyLevelKey);
}
