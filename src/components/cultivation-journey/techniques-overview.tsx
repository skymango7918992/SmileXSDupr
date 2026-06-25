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
        <p className="text-xs cj-muted">
          16 項匹克球擊球功法 · 熟練度 0～100 · 基礎／入門／小成／入微／大成／圓滿
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
      className="cj-jade-card btn-touch w-full"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold cj-gold">{technique.name}</p>
          <p className="truncate text-[10px] cj-muted">{technique.shot}</p>
        </div>
        <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold cj-gold">
          {levelMeta.name}
        </span>
      </div>

      <p className="mb-2 text-[11px] cj-emerald">稱號：{levelTitle}</p>

      <div
        className="mb-1 h-1.5 overflow-hidden rounded-full"
        style={{ background: "var(--cj-track)" }}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-400"
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex items-baseline justify-between text-[10px] cj-muted">
        <span>{score} / 100</span>
        {target.nextLevel != null && target.pointsToNext != null && (
          <span>
            再 {target.pointsToNext} 點達
            {getProficiencyLevelMeta(target.nextLevel).name}
          </span>
        )}
        {target.nextLevel == null && <span className="cj-gold">圓滿</span>}
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
