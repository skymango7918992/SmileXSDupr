"use client";

import { Plus } from "lucide-react";
import type { ScheduleSessionWithStats } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  sessions: ScheduleSessionWithStats[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  loading?: boolean;
};

export function SessionTabs({
  sessions,
  activeId,
  onSelect,
  onCreate,
  loading,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">今日賽程組</p>
        <Button
          size="sm"
          variant="secondary"
          disabled={loading}
          onClick={onCreate}
        >
          <Plus className="h-4 w-4" />
          新增賽程
        </Button>
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
                "min-w-[140px] shrink-0 rounded-2xl border px-4 py-3 text-left transition-all",
                active
                  ? "border-emerald-600 bg-emerald-700 text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200",
              )}
            >
              <p className="truncate text-sm font-semibold">{session.name}</p>
              <p
                className={cn(
                  "mt-1 text-xs",
                  active ? "text-emerald-100" : "text-slate-500",
                )}
              >
                {session.player_count} 人 · {session.match_count} 場 · 完成{" "}
                {session.completed_count}
              </p>
            </button>
          );
        })}
      </div>

      {sessions.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
          尚無賽程組，請點「新增賽程」開始
        </p>
      )}
    </div>
  );
}
