"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Download, LayoutGrid, Plus } from "lucide-react";
import { XsAutoArrangeDialog } from "@/components/xs/xs-auto-arrange-dialog";
import { XsManualMatchDialog } from "@/components/xs/xs-manual-match-dialog";
import { XsMatchCard } from "@/components/xs/xs-match-card";
import { XsVenueTabs } from "@/components/xs/xs-venue-tabs";
import { useAppUi } from "@/components/providers/app-ui-provider";
import {
  createXsMatchWithScore,
  deleteXsMatch,
  ensureXsMatchDay,
  generateXsAutoMatches,
  getXsMatchesForDate,
  updateXsMatchScore,
} from "@/lib/actions/xs/match-flow";
import { exportMatchesToDuprCsv } from "@/lib/export-dupr-csv";
import { xsHomePath } from "@/lib/xs/paths";
import type { PlayerCultivationStats } from "@/lib/cultivation-tiers";
import type { MatchWithPlayers, Player, ScoreType } from "@/types/database";
import type { XsVenue } from "@/types/xs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  venues: XsVenue[];
  initialVenueId: string;
  players: Player[];
  initialMatchDate: string;
  initialMatches: MatchWithPlayers[];
  playerStats: Record<string, PlayerCultivationStats>;
  canDelete: boolean;
};

export function XsMatchCenter({
  venues,
  initialVenueId,
  players,
  initialMatchDate,
  initialMatches,
  playerStats,
  canDelete,
}: Props) {
  const router = useRouter();
  const [activeVenue, setActiveVenue] = useState(
    () => venues.find((v) => v.id === initialVenueId) ?? venues[0]!,
  );
  const [matchDate, setMatchDate] = useState(initialMatchDate);
  const [matchesByVenue, setMatchesByVenue] = useState<
    Record<string, MatchWithPlayers[]>
  >({
    [initialVenueId]: initialMatches,
  });
  const [showManual, setShowManual] = useState(false);
  const [showAuto, setShowAuto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { error: toastError, success } = useAppUi();

  const matches = matchesByVenue[activeVenue.id] ?? [];

  const matchCounts = useMemo(
    () =>
      Object.fromEntries(
        venues.map((v) => [v.id, (matchesByVenue[v.id] ?? []).length]),
      ),
    [venues, matchesByVenue],
  );

  const syncVenueUrl = useCallback(
    (venue: XsVenue) => {
      router.replace(xsHomePath({ venue: venue.slug }), { scroll: false });
    },
    [router],
  );

  const loadMatches = useCallback(async (venueId: string, date: string) => {
    await ensureXsMatchDay(venueId, date);
    const list = await getXsMatchesForDate(venueId, date);
    setMatchesByVenue((prev) => ({ ...prev, [venueId]: list }));
    return list;
  }, []);

  const handleVenueChange = (venue: XsVenue) => {
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
    await createXsMatchWithScore(
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

  const handleAutoArrange = async (input: {
    playerIds: string[];
    matchCount: number;
    scoreType: ScoreType;
  }) => {
    await generateXsAutoMatches(
      activeVenue.id,
      matchDate,
      input.playerIds,
      input.matchCount,
      input.scoreType,
    );
    await loadMatches(activeVenue.id, matchDate);
  };

  const handleSaveScore = async (
    matchId: string,
    team1Score: number,
    team2Score: number,
  ) => {
    await updateXsMatchScore(matchId, team1Score, team2Score);
    await loadMatches(activeVenue.id, matchDate);
  };

  const handleDelete = async (matchId: string) => {
    await deleteXsMatch(matchId);
    await loadMatches(activeVenue.id, matchDate);
  };

  const handleExport = () => {
    try {
      const scoreType =
        matches.find((m) => m.score_type)?.score_type ?? "sideout";
      const { exported } = exportMatchesToDuprCsv(matchDate, matches, {
        sessionName: activeVenue.name,
        scoreType,
      });
      success(`已匯出 ${exported} 場`);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "匯出失敗");
    }
  };

  if (venues.length === 0) {
    return (
      <div className="alert-danger">
        尚未設定活動場地，請至設定頁新增，或執行資料庫 migration。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">今日對戰</h2>
        <p className="text-sm text-muted">
          依地點與日期分開記錄 · 手動新增成績或自動排列 · 最新在最上方
        </p>
      </div>

      <XsVenueTabs
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

      {error && <div className="alert-danger">{error}</div>}

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-baseline justify-between gap-3 border-b border-divider px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
              {activeVenue.name}
            </h3>
            <p className="text-xs text-muted">
              {matchDate} · {matches.length} 場
            </p>
          </div>
          {matches.length > 0 && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              最新在上
            </span>
          )}
        </div>

        {matches.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">
            此地點尚無對戰紀錄，請按「新增成績」或「自動排列」
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 p-2 sm:gap-2 sm:p-3">
            {matches.map((match, index) => (
              <XsMatchCard
                key={match.id}
                match={match}
                displayIndex={matches.length - index}
                playerStats={playerStats}
                canDelete={canDelete}
                onSaveScore={handleSaveScore}
                onDelete={canDelete ? handleDelete : undefined}
                disabled={isPending}
              />
            ))}
          </div>
        )}
      </section>

      <div className="sticky bottom-3 z-10 flex gap-2 rounded-xl border border-border bg-surface/95 p-1.5 shadow-lg backdrop-blur-sm sm:bottom-4">
        <Button
          onClick={() => setShowManual(true)}
          className="btn-touch h-11 flex-1"
          disabled={isPending || players.length < 4}
        >
          <Plus className="h-4 w-4" />
          新增成績
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowAuto(true)}
          className="btn-touch h-11 flex-1"
          disabled={isPending || players.length < 4}
        >
          <LayoutGrid className="h-4 w-4" />
          自動排列
        </Button>
        <Button
          variant="secondary"
          onClick={handleExport}
          className="btn-touch h-11 shrink-0 px-3"
          disabled={isPending || matches.length === 0}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">匯出</span>
        </Button>
      </div>

      {showManual && (
        <XsManualMatchDialog
          players={players}
          playerStats={playerStats}
          onSubmit={handleAddMatch}
          onClose={() => setShowManual(false)}
        />
      )}

      {showAuto && (
        <XsAutoArrangeDialog
          players={players}
          onSubmit={handleAutoArrange}
          onClose={() => setShowAuto(false)}
        />
      )}
    </div>
  );
}
