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
    <article
      className={cn(
        "khpa-match-card group relative overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-sm",
        team1Wins && "border-l-[3px] !border-l-primary",
        team2Wins && "border-r-[3px] !border-r-amber-500",
      )}
    >
      <div className="flex items-center gap-2 border-b border-divider/60 px-3 py-1.5">
        <span className="font-data shrink-0 text-[11px] font-bold tabular-nums text-muted">
          #{displayIndex}
        </span>
        <span className="min-w-0 truncate text-[10px] text-muted">
          {SCORE_TYPE_LABEL[scoreType]}
        </span>
        {canDelete && onDelete && (
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled || saving}
            onClick={() => void handleDelete()}
            className="ml-auto h-7 w-7 shrink-0 p-0 text-muted hover:text-danger"
            aria-label={`刪除第 ${displayIndex} 場`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 px-3 py-2.5 sm:gap-x-3 sm:py-3">
        <CompactTeam
          players={team1}
          playerWins={playerWins}
          side="left"
          highlight={team1Wins}
        />

        <div
          className={cn(
            "flex min-w-[3.5rem] flex-col items-center justify-center rounded-lg px-2 py-1.5 sm:min-w-[4rem]",
            "bg-surface-muted/60 ring-1 ring-border/50",
          )}
          aria-label={`比分 ${s1} 比 ${s2}`}
        >
          <p className="font-data text-xl font-bold leading-none tabular-nums sm:text-2xl">
            <span className={cn(team1Wins && "text-primary")}>{s1}</span>
            <span className="mx-0.5 text-muted/70">:</span>
            <span className={cn(team2Wins && "text-amber-700")}>{s2}</span>
          </p>
        </div>

        <CompactTeam
          players={team2}
          playerWins={playerWins}
          side="right"
          highlight={team2Wins}
        />
      </div>
    </article>
  );
}

function CompactTeam({
  players,
  playerWins,
  side,
  highlight,
}: {
  players: ReturnType<typeof getTeamPlayers>;
  playerWins: Record<string, number>;
  side: "left" | "right";
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1",
        side === "right" && "items-end",
      )}
    >
      {players.map((player) =>
        player ? (
          <div
            key={player.id}
            className={cn(
              "flex max-w-full items-center gap-1.5",
              side === "right" && "flex-row-reverse",
              highlight && "text-foreground",
            )}
            title={player.dupr_id ? `${player.display_name} · ${player.dupr_id}` : player.display_name}
          >
            <KhpaBadgeAvatar
              wins={playerWins[player.id] ?? 0}
              name={player.display_name}
              size="sm"
            />
            <span
              className={cn(
                "truncate text-xs font-semibold leading-tight sm:text-sm",
                highlight ? "text-inherit" : "text-secondary-foreground",
              )}
            >
              {player.display_name}
            </span>
          </div>
        ) : null,
      )}
    </div>
  );
}
