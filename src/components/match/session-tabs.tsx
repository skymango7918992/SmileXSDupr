"use client";

import { Plus, Trash2 } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { SCORE_TYPE_LABEL } from "@/lib/dupr-score-type";
import type { ScheduleSessionWithStats } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  sessions: ScheduleSessionWithStats[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete?: (sessionId: string, sessionName: string) => void;
  loading?: boolean;
};

export function SessionTabs({
  sessions,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  loading,
}: Props) {
  const { confirm } = useAppUi();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">今日賽程組</p>
        <div className="flex gap-2">
          {activeId && onDelete && (
            <Button
              size="sm"
              variant="danger"
              disabled={loading}
              onClick={() => {
                const session = sessions.find((s) => s.id === activeId);
                if (!session) return;
                void (async () => {
                  const ok = await confirm({
                    title: `刪除「${session.name}」？`,
                    description: "此賽程所有場次與名單將一併刪除，無法復原。",
                    confirmLabel: "刪除",
                    variant: "danger",
                  });
                  if (ok) onDelete(session.id, session.name);
                })();
              }}
            >
              <Trash2 className="h-4 w-4" />
              刪除
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={onCreate}
          >
            <Plus className="h-4 w-4" />
            新增
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {sessions.map((session) => {
          const active = session.id === activeId;
          return (
            <button
              key={session.id}
              type="button"
              onClick={() => onSelect(session.id)}
              className={cn(
                "min-w-[140px] shrink-0 cursor-pointer rounded-[12px] border px-4 py-3 text-left transition-colors duration-150",
                active
                  ? "glass-nav-active text-foreground"
                  : "border border-border bg-surface text-secondary-foreground hover:bg-surface-muted hover:text-foreground",
              )}
            >
              <p className="truncate text-sm font-semibold">{session.name}</p>
              <p className="mt-1 text-xs text-muted">
                {SCORE_TYPE_LABEL[session.score_type ?? "sideout"]} ·{" "}
                {session.player_count} 人 · {session.match_count} 場 · 完成{" "}
                {session.completed_count}
              </p>
            </button>
          );
        })}
      </div>

      {sessions.length === 0 && (
        <p className="rounded-[12px] border border-dashed border-border py-6 text-center text-sm text-muted">
          尚無賽程組，請點「新增賽程」開始
        </p>
      )}
    </div>
  );
}
