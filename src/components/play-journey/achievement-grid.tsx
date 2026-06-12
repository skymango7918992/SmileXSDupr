import type { Achievement } from "@/types/play-journey";
import { cn } from "@/lib/utils";

type Props = {
  achievements: Achievement[];
};

export function AchievementGrid({ achievements }: Props) {
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <section className="glass-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">獎章成就</h2>
          <p className="text-xs text-muted">
            已解鎖 {unlocked.length} / {achievements.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {unlocked.map((a) => (
          <AchievementCard key={a.id} achievement={a} />
        ))}
        {locked.map((a) => (
          <AchievementCard key={a.id} achievement={a} />
        ))}
      </div>
    </section>
  );
}

function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  return (
    <div
      className={cn(
        "play-achievement",
        a.unlocked
          ? "play-achievement--unlocked"
          : "play-achievement--locked",
      )}
      title={a.description}
    >
      <span className="play-achievement__emoji" aria-hidden>
        {a.emoji}
      </span>
      <p className="play-achievement__title">{a.title}</p>
      <p className="play-achievement__desc">{a.description}</p>
      {!a.unlocked && a.progress && (
        <div className="play-achievement__progress">
          <div
            className="play-achievement__progress-bar"
            style={{
              width: `${Math.min(100, (a.progress.current / a.progress.target) * 100)}%`,
            }}
          />
          <span className="font-data text-[10px] text-muted">
            {a.progress.current}/{a.progress.target}
          </span>
        </div>
      )}
    </div>
  );
}
