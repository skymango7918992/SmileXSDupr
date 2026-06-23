"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Download, Plus } from "lucide-react";
import { KhpaManualMatchDialog } from "@/components/khpa/khpa-manual-match-dialog";
import { KhpaMatchCard } from "@/components/khpa/khpa-match-card";
import { KhpaVenueTabs } from "@/components/khpa/khpa-venue-tabs";
import { useAppUi } from "@/components/providers/app-ui-provider";
import {
  createKhpaMatchWithScore,
  deleteKhpaMatch,
  ensureKhpaMatchDay,
  getKhpaMatchesForDate,
} from "@/lib/actions/khpa/sessions";
import { exportKhpaMatchesToDuprCsv } from "@/lib/khpa/export-csv";
import type { KhpaLeaderboardEntry } from "@/types/khpa";
import type { KhpaMatchWithPlayers, KhpaPlayer, KhpaVenue } from "@/types/khpa";
import type { ScoreType } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  venues: KhpaVenue[];
  initialVenueId: string;
  players: KhpaPlayer[];
  initialMatchDate: string;
  initialMatches: KhpaMatchWithPlayers[];
  leaderboard: KhpaLeaderboardEntry[];
  canDelete: boolean;
};

export function KhpaMatchCenter({
  venues,
  initialVenueId,
  players,
  initialMatchDate,
  initialMatches,
  leaderboard,
  canDelete,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeVenue, setActiveVenue] = useState(
    () => venues.find((v) => v.id === initialVenueId) ?? venues[0]!,
  );
  const [matchDate, setMatchDate] = useState(initialMatchDate);
  const [matchesByVenue, setMatchesByVenue] = useState<Record<string, KhpaMatchWithPlayers[]>>({
    [initialVenueId]: initialMatches,
  });
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { error: toastError, success } = useAppUi();

  const matches = matchesByVenue[activeVenue.id] ?? [];

  const playerWins = useMemo(
    () => Object.fromEntries(leaderboard.map((e) => [e.playerId, e.wins])),
    [leaderboard],
  );

  const matchCounts = useMemo(
    () =>
      Object.fromEntries(
        venues.map((v) => [v.id, (matchesByVenue[v.id] ?? []).length]),
      ),
    [venues, matchesByVenue],
  );

  const syncVenueUrl = useCallback(
    (venue: KhpaVenue) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("venue", venue.slug);
      router.replace(`/khpa?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const loadMatches = useCallback(async (venueId: string, date: string) => {
    await ensureKhpaMatchDay(venueId, date);
    const list = await getKhpaMatchesForDate(venueId, date);
    setMatchesByVenue((prev) => ({ ...prev, [venueId]: list }));
    return list;
  }, []);

  const handleVenueChange = (venue: KhpaVenue) => {
    setActiveVenue(venue);
    syncVenueUrl(venue);
    startTransition(async () => {
      try {
        setError(null);
        await loadMatches(venue.id, matchDate);
      } catch (e) {
        setError(e instanceof Error ? e.message : "載入失敗");
      }
    });
  };

  const handleDateChange = (date: string) => {
    setMatchDate(date);
    startTransition(async () => {
      try {
        setError(null);
        await loadMatches(activeVenue.id, date);
      } catch (e) {
        setError(e instanceof Error ? e.message : "載入失敗");
      }
    });
  };

  const handleAddMatch = async (input: {
    team1: [string, string];
    team2: [string, string];
    team1Score: number;
    team2Score: number;
    scoreType: ScoreType;
  }) => {
    await createKhpaMatchWithScore(
      activeVenue.id,
      matchDate,
      input.team1,
      input.team2,
      input.team1Score,
      input.team2Score,
      input.scoreType,
    );
    await loadMatches(activeVenue.id, matchDate);
  };

  const handleDelete = async (matchId: string) => {
    await deleteKhpaMatch(matchId);
    await loadMatches(activeVenue.id, matchDate);
  };

  const handleExport = () => {
    try {
      const result = exportKhpaMatchesToDuprCsv(matchDate, matches, {
        venueName: activeVenue.name,
      });
      success(`已匯出 ${result.exported} 場`);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "匯出失敗");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="khpa-scoreboard mb-1 flex items-center gap-2">
          <span className="khpa-live-dot" aria-hidden />
          <span className="khpa-section-label">賽事紀錄</span>
        </div>
        <h2 className="text-lg font-semibold">今日對戰</h2>
        <p className="text-sm text-muted">依地點與日期分開記錄 · 最新在最上方</p>
      </div>

      <KhpaVenueTabs
        venues={venues}
        activeVenueId={activeVenue.id}
        onChange={handleVenueChange}
        matchCounts={matchCounts}
        disabled={isPending}
      />

      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <label className="mb-1 flex items-center gap-1 text-xs text-muted">
            <CalendarDays className="h-3.5 w-3.5" />
            日期
          </label>
          <Input
            type="date"
            value={matchDate}
            onChange={(e) => handleDateChange(e.target.value)}
            disabled={isPending}
            className="h-11"
          />
        </div>
      </div>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 -mx-1 flex gap-2 rounded-2xl border border-border bg-surface/95 p-2 shadow-lg backdrop-blur-sm">
        <Button
          onClick={() => setShowManual(true)}
          className="btn-touch h-12 flex-1 text-base"
          disabled={isPending || players.length < 4}
        >
          <Plus className="h-5 w-5" />
          新增成績
        </Button>
        <Button
          variant="secondary"
          onClick={handleExport}
          className="btn-touch h-12 shrink-0"
          disabled={isPending || matches.length === 0}
        >
          <Download className="h-4 w-4" />
          匯出
        </Button>
      </div>

      {error && <div className="alert-danger">{error}</div>}

      <Card>
        <CardTitle className="mb-1 text-base sm:text-lg">
          {activeVenue.name}
        </CardTitle>
        <p className="mb-4 text-sm text-muted">
          {matchDate} · 共 {matches.length} 場
        </p>
        {matches.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            此地點尚無對戰紀錄，請按「新增成績」
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {matches.map((match, index) => (
              <KhpaMatchCard
                key={match.id}
                match={match}
                displayIndex={matches.length - index}
                playerWins={playerWins}
                canDelete={canDelete}
                onDelete={canDelete ? handleDelete : undefined}
                disabled={isPending}
              />
            ))}
          </div>
        )}
      </Card>

      {showManual && (
        <KhpaManualMatchDialog
          players={players}
          playerWins={playerWins}
          onSubmit={handleAddMatch}
          onClose={() => setShowManual(false)}
        />
      )}
    </div>
  );
}
