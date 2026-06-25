"use client";

import { useState } from "react";
import { Pencil, Save, Trash2 } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { KhpaBadgeAvatar } from "@/components/khpa/badge-avatar";
import { SCORE_TYPE_LABEL } from "@/lib/dupr-score-type";
import { formatDuprRating } from "@/lib/player-display";
import type { PlayerCultivationStats } from "@/lib/cultivation-tiers";
import type { MatchWithPlayers } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  match: MatchWithPlayers;
  displayIndex: number;
  playerStats: Record<string, PlayerCultivationStats>;
  canDelete: boolean;
  onSaveScore?: (matchId: string, team1Score: number, team2Score: number) => Promise<void>;
  onDelete?: (matchId: string) => Promise<void>;
  disabled?: boolean;
};

function getTeamPlayers(match: MatchWithPlayers, team: 1 | 2) {
  return match.match_players
    .filter((mp) => mp.team === team)
    .sort((a, b) => a.position - b.position)
    .map((mp) => mp.player);
}

export function XsMatchCard({
  match,
  displayIndex,
  playerStats,
  canDelete,
  onSaveScore,
  onDelete,
  disabled,
}: Props) {
  const isScheduled = match.status === "scheduled";
  const [editing, setEditing] = useState(isScheduled);
  const [team1Score, setTeam1Score] = useState(
    match.team1_score?.toString() ?? "",
  );
  const [team2Score, setTeam2Score] = useState(
    match.team2_score?.toString() ?? "",
  );
  const [saving, setSaving] = useState(false);
  const { confirm, success, error: toastError } = useAppUi();

  const team1 = getTeamPlayers(match, 1);
  const team2 = getTeamPlayers(match, 2);
  const s1 = match.team1_score;
  const s2 = match.team2_score;
  const team1Wins = !isScheduled && s1 != null && s2 != null && s1 > s2;
  const team2Wins = !isScheduled && s1 != null && s2 != null && s2 > s1;
  const scoreType = match.score_type ?? "sideout";

  const handleSave = async () => {
    if (!onSaveScore) return;
    const score1 = Number(team1Score);
    const score2 = Number(team2Score);
    if (Number.isNaN(score1) || Number.isNaN(score2) || score1 < 0 || score2 < 0) {
      toastError("請輸入有效比分");
      return;
    }
    setSaving(true);
    try {
      await onSaveScore(match.id, score1, score2);
      setEditing(false);
      success(`第 ${displayIndex} 場比分已儲存`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const ok = await confirm({
      title: `刪除第 ${displayIndex} 場？`,
      description: isScheduled
        ? "刪除後無法復原。"
        : "此場已完成並已計分，刪除後獲勝榜與匯出紀錄也會一併移除。",
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
        "group relative overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-sm",
        team1Wins && "border-l-[3px] !border-l-primary",
        team2Wins && "border-r-[3px] !border-r-amber-500",
        isScheduled && "border-dashed",
      )}
    >
      <div className="flex items-center gap-2 border-b border-divider/60 px-3 py-1.5">
        <span className="font-data shrink-0 text-[11px] font-bold tabular-nums text-muted">
          #{displayIndex}
        </span>
        <span className="min-w-0 truncate text-[10px] text-muted">
          {SCORE_TYPE_LABEL[scoreType]}
        </span>
        {isScheduled && (
          <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
            待記分
          </span>
        )}
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
          playerStats={playerStats}
          side="left"
          highlight={team1Wins}
        />

        <div
          className={cn(
            "flex min-w-[3.5rem] flex-col items-center justify-center rounded-lg px-2 py-1.5 sm:min-w-[4rem]",
            "bg-surface-muted/60 ring-1 ring-border/50",
          )}
        >
          {editing && onSaveScore ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                className="h-9 w-12 text-center text-base font-bold"
                value={team1Score}
                onChange={(e) => setTeam1Score(e.target.value)}
                disabled={disabled || saving}
                aria-label="隊伍 1 比分"
              />
              <span className="text-muted">:</span>
              <Input
                type="number"
                min={0}
                className="h-9 w-12 text-center text-base font-bold"
                value={team2Score}
                onChange={(e) => setTeam2Score(e.target.value)}
                disabled={disabled || saving}
                aria-label="隊伍 2 比分"
              />
            </div>
          ) : (
            <p className="font-data text-xl font-bold leading-none tabular-nums sm:text-2xl">
              <span className={cn(team1Wins && "text-primary")}>{s1 ?? "–"}</span>
              <span className="mx-0.5 text-muted/70">:</span>
              <span className={cn(team2Wins && "text-amber-700")}>{s2 ?? "–"}</span>
            </p>
          )}
        </div>

        <CompactTeam
          players={team2}
          playerStats={playerStats}
          side="right"
          highlight={team2Wins}
        />
      </div>

      {onSaveScore && (isScheduled || editing) && (
        <div className="flex gap-2 border-t border-divider px-3 py-2">
          {editing ? (
            <Button
              size="sm"
              loading={saving}
              disabled={disabled}
              onClick={() => void handleSave()}
              className="btn-touch flex-1"
            >
              <Save className="h-4 w-4" />
              儲存比分
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled={disabled}
              onClick={() => setEditing(true)}
              className="btn-touch flex-1"
            >
              <Pencil className="h-4 w-4" />
              編輯比分
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

function CompactTeam({
  players,
  playerStats,
  side,
  highlight,
}: {
  players: ReturnType<typeof getTeamPlayers>;
  playerStats: Record<string, PlayerCultivationStats>;
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
          >
            <KhpaBadgeAvatar
              wins={playerStats[player.id]?.wins ?? 0}
              winRate={playerStats[player.id]?.winRate}
              gender={player.avatar_gender}
              name={player.display_name}
              size="sm"
            />
            <div className={cn("min-w-0", side === "right" && "text-right")}>
              <p
                className={cn(
                  "truncate text-xs font-semibold leading-tight sm:text-sm",
                  highlight ? "text-inherit" : "text-secondary-foreground",
                )}
              >
                {player.display_name}
              </p>
              <p className="text-[10px] font-medium leading-tight text-primary sm:text-xs">
                DUPR {formatDuprRating(player.dupr_rating)}
              </p>
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}
