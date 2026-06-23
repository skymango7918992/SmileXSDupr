"use client";

import type { MatchWithPlayers } from "@/types/database";
import { Card, CardTitle } from "@/components/ui/card";
import { MatchCard } from "@/components/match/match-card";

type Props = {
  matches: MatchWithPlayers[];
  sessionName?: string;
  onSaveScore: (
    matchId: string,
    team1Score: number,
    team2Score: number,
  ) => Promise<void>;
  onDelete: (matchId: string) => Promise<void>;
  canDelete?: boolean;
  loading?: boolean;
};

export function MatchTable({
  matches,
  sessionName,
  onSaveScore,
  onDelete,
  canDelete = true,
  loading,
}: Props) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <CardTitle>{sessionName ? `${sessionName} 對戰表` : "今日對戰表"}</CardTitle>
        <span className="tag tag-neutral">{matches.length} 場</span>
      </div>

      {matches.length === 0 ? (
        <p className="text-sm text-muted">
          尚無對戰，請選擇球員後按「自動排場」或「手動新增」。
        </p>
      ) : (
        <div className="match-card-list -mx-1 flex flex-col gap-3 pt-1">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              allMatches={matches}
              onSaveScore={onSaveScore}
              onDelete={onDelete}
              canDelete={canDelete}
              disabled={loading}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
