"use client";

import { useState } from "react";
import { Pencil, Save, Trash2 } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import {
  getMatchDisplayStatus,
  MATCH_STATUS_LABEL,
  type MatchDisplayStatus,
} from "@/lib/match-status";
import { playerDisplayName } from "@/lib/player-display";
import type { MatchWithPlayers, Player } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  match: MatchWithPlayers;
  allMatches: MatchWithPlayers[];
  onSaveScore: (
    matchId: string,
    team1Score: number,
    team2Score: number,
  ) => Promise<void>;
  onDelete: (matchId: string) => Promise<void>;
  disabled?: boolean;
};

function getTeamPlayers(
  match: MatchWithPlayers,
  team: 1 | 2,
): (Player | undefined)[] {
  return match.match_players
    .filter((mp) => mp.team === team)
    .sort((a, b) => a.position - b.position)
    .map((mp) => mp.player);
}

const statusBadgeClass: Record<MatchDisplayStatus, string> = {
  live: "match-status-badge--live",
  upcoming: "match-status-badge--upcoming",
  in_progress: "match-status-badge--in_progress",
  ended: "match-status-badge--ended",
};

function TeamNames({
  players,
  align = "left",
}: {
  players: (Player | undefined)[];
  align?: "left" | "right";
}) {
  return (
    <div className={cn("space-y-1", align === "right" && "text-right")}>
      {players.map((player, idx) =>
        player ? (
          <p key={player.id} className="text-base font-medium text-foreground">
            {playerDisplayName(player)}
          </p>
        ) : (
          <p key={idx} className="text-base text-muted">
            —
          </p>
        ),
      )}
    </div>
  );
}

export function MatchCard({
  match,
  allMatches,
  onSaveScore,
  onDelete,
  disabled,
}: Props) {
  const [editing, setEditing] = useState(
    match.team1_score == null || match.team2_score == null,
  );
  const [team1Score, setTeam1Score] = useState(
    match.team1_score?.toString() ?? "",
  );
  const [team2Score, setTeam2Score] = useState(
    match.team2_score?.toString() ?? "",
  );
  const [saving, setSaving] = useState(false);
  const { error: toastError, confirm, success } = useAppUi();

  const displayStatus = getMatchDisplayStatus(match, allMatches);
  const isEnded = displayStatus === "ended";
  const team1 = getTeamPlayers(match, 1);
  const team2 = getTeamPlayers(match, 2);

  const s1 = match.team1_score;
  const s2 = match.team2_score;
  const team1Wins =
    isEnded && s1 != null && s2 != null && s1 > s2;
  const team2Wins =
    isEnded && s1 != null && s2 != null && s2 > s1;

  const handleSave = async () => {
    const score1 = Number(team1Score);
    const score2 = Number(team2Score);
    if (Number.isNaN(score1) || Number.isNaN(score2)) {
      toastError("請輸入有效比分");
      return;
    }
    setSaving(true);
    try {
      await onSaveScore(match.id, score1, score2);
      setEditing(false);
      success(`第 ${match.round_number} 場比分已儲存`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: `刪除第 ${match.round_number} 場？`,
      description: isEnded
        ? "此場已完成並已計分，刪除後獲勝榜與匯出紀錄也會一併移除。"
        : "刪除後無法復原。",
      confirmLabel: "刪除",
      variant: "danger",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await onDelete(match.id);
      success(`已刪除第 ${match.round_number} 場`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "match-card-outer",
        displayStatus === "live" && "match-card-outer--live",
      )}
    >
    <article
      className={cn(
        "match-card",
        displayStatus === "live" && "match-card--live",
        isEnded && "match-card--ended",
      )}
    >
      <span
        className={cn("match-status-badge", statusBadgeClass[displayStatus])}
      >
        {MATCH_STATUS_LABEL[displayStatus]}
      </span>

      <div className="mb-4 pr-24">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          第 {match.round_number} 場
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
        <div className={cn(team1Wins && "text-success")}>
          <TeamNames players={team1} align="left" />
        </div>

        <div className="flex flex-col items-center gap-1 px-1">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                className="w-14 text-center text-base font-bold sm:w-16"
                value={team1Score}
                onChange={(e) => setTeam1Score(e.target.value)}
                disabled={disabled || saving}
                aria-label="隊伍 1 比分"
              />
              <span className="text-lg font-bold text-muted">:</span>
              <Input
                type="number"
                min={0}
                className="w-14 text-center text-base font-bold sm:w-16"
                value={team2Score}
                onChange={(e) => setTeam2Score(e.target.value)}
                disabled={disabled || saving}
                aria-label="隊伍 2 比分"
              />
            </div>
          ) : (
            <p className="font-data text-2xl font-bold tabular-nums text-foreground">
              {s1 ?? "–"} : {s2 ?? "–"}
            </p>
          )}
          <span className="text-[10px] font-medium uppercase text-muted">
            比分
          </span>
        </div>

        <div className={cn(team2Wins && "text-success")}>
          <TeamNames players={team2} align="right" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-divider pt-4">
        {editing ? (
          <Button
            size="sm"
            loading={saving}
            disabled={disabled}
            onClick={() => void handleSave()}
            className="btn-touch max-md:flex-1"
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
            className="btn-touch max-md:flex-1"
          >
            <Pencil className="h-4 w-4" />
            編輯
          </Button>
        )}
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
    </article>
    </div>
  );
}
