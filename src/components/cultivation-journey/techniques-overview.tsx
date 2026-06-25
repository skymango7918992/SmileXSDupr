"use client";

import { ProficiencyLevelGuide } from "@/components/cultivation-journey/proficiency-roadmap";
import {
  getNextProficiencyTarget,
  getProficiencyLevelMeta,
  getTechniqueById,
  getTechniqueLevelTitle,
  type PickleballTechnique,
} from "@/lib/pickleball-techniques";
import type { TechniqueProgress } from "@/types/technique-practice";

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
        <h3 className="cj-section-title text-base">我的閉關功法</h3>
        <p className="text-xs cj-muted text-pretty sm:text-xs">
          16 項功法 · 0～100 熟練度
          <span className="hidden md:inline"> · 基礎／入門／小成／入微／大成／圓滿</span>
        </p>
      </div>

      <ProficiencyLevelGuide />

      {categories.map((category) => (
        <section key={category}>
          <p className="cj-category-label">{category}</p>
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
  const target = getNextProficiencyTarget(score);

  return (
    <button
      type="button"
      onClick={onClick}
      className="cj-jade-card btn-touch w-full min-w-0 overflow-hidden"
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm leading-snug text-pretty">
          <span className="font-semibold text-foreground">{technique.name}</span>
          <span className="mx-1 text-[10px] cj-muted" aria-hidden>
            ·
          </span>
          <span className="text-[10px] cj-muted">{technique.shot}</span>
        </p>
        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          {levelMeta.name}
        </span>
      </div>

      <p className="mb-2 text-[11px] cj-emerald text-pretty">稱號：{levelTitle}</p>

      <div
        className="mb-1 h-1.5 overflow-hidden rounded-full"
        style={{ background: "var(--cj-track)" }}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-400"
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex flex-col gap-0.5 text-[10px] cj-muted sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
        <span className="shrink-0">{score} / 100</span>
        {target.nextLevel != null && target.pointsToNext != null && (
          <span className="text-pretty sm:text-right">
            再 {target.pointsToNext} 點達
            {getProficiencyLevelMeta(target.nextLevel).name}
          </span>
        )}
        {target.nextLevel == null && <span className="text-amber-600">圓滿</span>}
      </div>

      {progress.last_practiced_at && (
        <p className="mt-1.5 text-[10px] cj-faint">
          上次閉關：{progress.last_practiced_at.slice(0, 10)}
        </p>
      )}

      <p className="mt-2 line-clamp-2 text-[10px] italic leading-snug cj-faint">
        {technique.quote}
      </p>
    </button>
  );
}
