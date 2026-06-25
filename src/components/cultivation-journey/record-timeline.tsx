"use client";

import { Trash2 } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import {
  RECORD_TYPE_ICON,
  RECORD_TYPE_LABEL,
  type CultivationRecord,
} from "@/types/cultivation-journey";
import { getTechniqueById } from "@/lib/pickleball-techniques";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  records: CultivationRecord[];
  filter?: "all" | "retreat" | "sparring" | "trial";
  onDelete?: (id: string) => Promise<void>;
  disabled?: boolean;
};

const RESULT_LABEL = { win: "勝", loss: "敗", draw: "平" } as const;

export function CultivationRecordTimeline({
  records,
  filter = "all",
  onDelete,
  disabled,
}: Props) {
  const { confirm } = useAppUi();
  const list =
    filter === "all" ? records : records.filter((r) => r.record_type === filter);

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
        尚無修行紀錄，點下方按鈕開始第一筆閉關或切磋。
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {list.map((record) => (
        <li
          key={record.id}
          className="cultivation-record-item rounded-xl border border-border bg-surface p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base" aria-hidden>
                  {RECORD_TYPE_ICON[record.record_type]}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {RECORD_TYPE_LABEL[record.record_type]}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  +{record.xp_earned} 修為
                </span>
                {record.source !== "manual" && (
                  <span className="text-[10px] text-muted">DUPR 匯入</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted">
                {record.occurred_on}
                {record.venue_name ? ` · ${record.venue_name}` : ""}
              </p>
            </div>
            {onDelete && record.source === "manual" && record.record_type !== "retreat" && (
              <Button
                size="sm"
                variant="ghost"
                disabled={disabled}
                className="h-8 w-8 shrink-0 p-0 text-muted hover:text-danger"
                onClick={async () => {
                  const ok = await confirm({
                    title: "刪除此筆修行紀錄？",
                    description: "修為將一併扣除，無法復原。",
                    confirmLabel: "刪除",
                    variant: "danger",
                  });
                  if (ok) await onDelete(record.id);
                }}
                aria-label="刪除紀錄"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <RecordBody record={record} />
        </li>
      ))}
    </ul>
  );
}

function RecordBody({ record }: { record: CultivationRecord }) {
  if (record.record_type === "retreat") {
    const skills = record.practice_skills
      .map((id) => getTechniqueById(id)?.name ?? id)
      .join("、");
    return (
      <div className="mt-2 space-y-1 text-xs text-secondary-foreground">
        {record.duration_minutes != null && (
          <p>閉關 {record.duration_minutes} 分鐘</p>
        )}
        {skills && <p>功法：{skills}</p>}
        {record.self_rating != null && (
          <p>自評：{"★".repeat(record.self_rating)}</p>
        )}
        {record.notes && <p className="text-muted">{record.notes}</p>}
      </div>
    );
  }

  if (record.record_type === "sparring") {
    return (
      <div className="mt-2 text-xs text-secondary-foreground">
        <p>
          比分 {record.team1_score} : {record.team2_score}
          {record.result && (
            <span
              className={cn(
                "ml-2 font-semibold",
                record.result === "win" && "text-primary",
                record.result === "loss" && "text-amber-700",
              )}
            >
              {RESULT_LABEL[record.result]}
            </span>
          )}
        </p>
        {record.notes && <p className="mt-1 text-muted">{record.notes}</p>}
      </div>
    );
  }

  return (
    <div className="mt-2 text-xs text-secondary-foreground">
      <p>
        試煉戰績 {record.trial_wins ?? 0} 勝 {record.trial_losses ?? 0} 敗
      </p>
      {record.notes && <p className="mt-1 text-muted">{record.notes}</p>}
    </div>
  );
}
