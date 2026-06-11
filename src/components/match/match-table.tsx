"use client";

import { useState } from "react";
import { Pencil, Save, Trash2 } from "lucide-react";
import type { MatchWithPlayers, Player } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  matches: MatchWithPlayers[];
  onSaveScore: (
    matchId: string,
    team1Score: number,
    team2Score: number,
  ) => Promise<void>;
  onDelete: (matchId: string) => Promise<void>;
  loading?: boolean;
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

function TeamCell({ players }: { players: (Player | undefined)[] }) {
  return (
    <div className="space-y-1">
      {players.map((player, idx) =>
        player ? (
          <div key={player.id} className="text-sm">
            <span className="font-medium text-gray-900">{player.name}</span>
            <span className="ml-2 text-xs text-gray-400">{player.dupr_id}</span>
          </div>
        ) : (
          <div key={idx} className="text-sm text-gray-400">
            —
          </div>
        ),
      )}
    </div>
  );
}

function ScoreRow({
  match,
  onSaveScore,
  onDelete,
  disabled,
}: {
  match: MatchWithPlayers;
  onSaveScore: Props["onSaveScore"];
  onDelete: Props["onDelete"];
  disabled?: boolean;
}) {
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

  const handleSave = async () => {
    const s1 = Number(team1Score);
    const s2 = Number(team2Score);
    if (Number.isNaN(s1) || Number.isNaN(s2)) {
      alert("請輸入有效比分");
      return;
    }
    setSaving(true);
    try {
      await onSaveScore(match.id, s1, s2);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const team1 = getTeamPlayers(match, 1);
  const team2 = getTeamPlayers(match, 2);

  const isCompleted = match.status === "completed";

  return (
    <tr className="border-t border-slate-100 transition hover:bg-emerald-50/40">
      <td className="px-3 py-4">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-900/20">
          {match.round_number}
        </span>
      </td>
      <td className="px-3 py-4">
        <TeamCell players={team1} />
      </td>
      <td className="px-3 py-4 text-center text-xs font-semibold text-gray-400">
        VS
      </td>
      <td className="px-3 py-4">
        <TeamCell players={team2} />
      </td>
      <td className="px-3 py-4">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            className="w-16 text-center"
            value={team1Score}
            onChange={(e) => setTeam1Score(e.target.value)}
            disabled={!editing || disabled || saving}
          />
          <span className="text-gray-400">:</span>
          <Input
            type="number"
            min={0}
            className="w-16 text-center"
            value={team2Score}
            onChange={(e) => setTeam2Score(e.target.value)}
            disabled={!editing || disabled || saving}
          />
        </div>
      </td>
      <td className="px-3 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              isCompleted
                ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800"
                : "rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800"
            }
          >
            {isCompleted ? "已完成" : "待進行"}
          </span>
          {editing ? (
            <Button
              size="sm"
              disabled={disabled || saving}
              onClick={() => void handleSave()}
            >
              <Save className="h-3.5 w-3.5" />
              存
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled={disabled}
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              編輯
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            disabled={disabled || saving}
            onClick={() => {
              if (confirm(`確定刪除第 ${match.round_number} 場？`)) {
                void onDelete(match.id);
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            刪
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function MatchTable({
  matches,
  onSaveScore,
  onDelete,
  loading,
}: Props) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <CardTitle>今日對戰表</CardTitle>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          {matches.length} 場
        </span>
      </div>

      {matches.length === 0 ? (
        <p className="text-sm text-gray-500">
          尚無對戰，請選擇球員後按「自動排場」或「手動新增」。
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="px-3 pb-2 font-medium">場次</th>
                <th className="px-3 pb-2 font-medium">隊伍 1</th>
                <th className="px-3 pb-2 font-medium text-center">VS</th>
                <th className="px-3 pb-2 font-medium">隊伍 2</th>
                <th className="px-3 pb-2 font-medium">比分</th>
                <th className="px-3 pb-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <ScoreRow
                  key={match.id}
                  match={match}
                  onSaveScore={onSaveScore}
                  onDelete={onDelete}
                  disabled={loading}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
