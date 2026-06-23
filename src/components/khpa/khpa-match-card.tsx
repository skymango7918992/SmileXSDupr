"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { KhpaBadgeAvatar } from "@/components/khpa/badge-avatar";
import { SCORE_TYPE_LABEL } from "@/lib/dupr-score-type";
import type { KhpaMatchWithPlayers } from "@/types/khpa";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  match: KhpaMatchWithPlayers;
  displayIndex: number;
  playerWins: Record<string, number>;
  canDelete: boolean;
  onDelete?: (matchId: string) => Promise<void>;
  disabled?: boolean;
};

function getTeamPlayers(match: KhpaMatchWithPlayers, team: 1 | 2) {
  return match.khpa_match_players
    .filter((mp) => mp.team === team)
    .sort((a, b) => a.position - b.position)
    .map((mp) => mp.player);
}

export function KhpaMatchCard({
  match,
  displayIndex,
  playerWins,
  canDelete,
  onDelete,
  disabled,
}: Props) {
  const [saving, setSaving] = useState(false);
  const { confirm, success } = useAppUi();

  const team1 = getTeamPlayers(match, 1);
  const team2 = getTeamPlayers(match, 2);
  const s1 = match.team1_score;
  const s2 = match.team2_score;
  const team1Wins = s1 != null && s2 != null && s1 > s2;
  const team2Wins = s1 != null && s2 != null && s2 > s1;
  const scoreType = match.score_type ?? "sideout";

  const handleDelete = async () => {
    if (!onDelete) return;
    const ok = await confirm({
      title: `刪除第 ${displayIndex} 場？`,
      description: "僅系統管理員可刪除，此操作無法復原。",
      confirmLabel: "刪除",
      variant: "danger",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await onDelete(match.id);
      success(`已刪除第 ${displayIndex} 場`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="khpa-match-card rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-data text-xs font-bold tabular-nums text-muted">
          MATCH #{displayIndex}
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-muted">
            {SCORE_TYPE_LABEL[scoreType]}
          </span>
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
            已鎖定
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        <div>
          <span className="khpa-team-tag khpa-team-tag--1 mb-2">隊伍 1</span>
          <TeamBlock
            players={team1}
            playerWins={playerWins}
            align="left"
            highlight={team1Wins}
          />
        </div>
        <p className="font-data text-center text-2xl font-bold tabular-nums">
          <span className={cn(team1Wins && "text-primary")}>{s1}</span>
          <span className="mx-1 text-muted">:</span>
          <span className={cn(team2Wins && "text-primary")}>{s2}</span>
        </p>
        <div className={cn("text-right")}>
          <span className="khpa-team-tag khpa-team-tag--2 mb-2">隊伍 2</span>
          <TeamBlock
            players={team2}
            playerWins={playerWins}
            align="right"
            highlight={team2Wins}
          />
        </div>
      </div>

      {canDelete && onDelete && (
        <div className="mt-4 flex justify-end border-t border-divider pt-3">
          <Button
            size="sm"
            variant="danger"
            disabled={disabled || saving}
            onClick={() => void handleDelete()}
            className="btn-touch"
          >
            <Trash2 className="h-4 w-4" />
            刪除
          </Button>
        </div>
      )}
    </article>
  );
}

function TeamBlock({
  players,
  playerWins,
  align,
  highlight,
}: {
  players: ReturnType<typeof getTeamPlayers>;
  playerWins: Record<string, number>;
  align: "left" | "right";
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        align === "right" && "items-end text-right",
        highlight && "text-success",
      )}
    >
      {players.map((player) =>
        player ? (
          <div
            key={player.id}
            className={cn(
              "flex items-center gap-2",
              align === "right" && "flex-row-reverse",
            )}
          >
            <KhpaBadgeAvatar
              wins={playerWins[player.id] ?? 0}
              name={player.display_name}
              size="md"
            />
            <div className={align === "right" ? "text-right" : ""}>
              <p className="text-sm font-medium leading-tight">
                {player.display_name}
              </p>
              <p className="text-[10px] text-muted">{player.dupr_id}</p>
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}
