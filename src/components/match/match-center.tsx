"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Download, History } from "lucide-react";
import {
  clearMatchesForDate,
  createManualMatch,
  deleteMatch,
  generateMatches,
  getMatchDates,
  getMatchesForDate,
  updateMatchScore,
  updateSelectedPlayers,
} from "@/lib/actions/matches";
import { exportMatchesToExcel } from "@/lib/export-excel";
import type { AppSettings, MatchDay, MatchWithPlayers, Player } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ManualMatchDialog } from "@/components/match/manual-match-dialog";
import { MatchGenerator } from "@/components/match/match-generator";
import { MatchTable } from "@/components/match/match-table";
import { PlayerChipGrid } from "@/components/match/player-chip-grid";

type Props = {
  players: Player[];
  initialMatchDate: string;
  initialMatchDay: MatchDay | null;
  initialMatches: MatchWithPlayers[];
  settings: AppSettings | null;
};

export function MatchCenter({
  players,
  initialMatchDate,
  initialMatchDay,
  initialMatches,
  settings,
}: Props) {
  const [matchDate, setMatchDate] = useState(initialMatchDate);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialMatchDay?.selected_player_ids ?? [],
  );
  const [matches, setMatches] = useState(initialMatches);
  const [historyDates, setHistoryDates] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadDateData = useCallback(async (date: string) => {
    const [matchList, dates] = await Promise.all([
      getMatchesForDate(date),
      getMatchDates(),
    ]);
    setMatches(matchList);
    setHistoryDates(dates);
    return matchList;
  }, []);

  useEffect(() => {
    void getMatchDates().then(setHistoryDates);
  }, []);

  const handleDateChange = (date: string) => {
    setMatchDate(date);
    setError(null);
    startTransition(async () => {
      try {
        const { getMatchDay } = await import("@/lib/actions/matches");
        const day = await getMatchDay(date);
        setSelectedIds(day?.selected_player_ids ?? []);
        await loadDateData(date);
      } catch (e) {
        setError(e instanceof Error ? e.message : "載入失敗");
      }
    });
  };

  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids);
    startTransition(async () => {
      try {
        await updateSelectedPlayers(matchDate, ids);
      } catch (e) {
        setError(e instanceof Error ? e.message : "儲存出席名單失敗");
      }
    });
  };

  const handleGenerate = async (courtCount: number) => {
    setError(null);
    startTransition(async () => {
      try {
        await generateMatches(matchDate, selectedIds, courtCount);
        await loadDateData(matchDate);
      } catch (e) {
        setError(e instanceof Error ? e.message : "排場失敗");
      }
    });
  };

  const handleClearDay = async () => {
    setError(null);
    startTransition(async () => {
      try {
        await clearMatchesForDate(matchDate);
        await loadDateData(matchDate);
      } catch (e) {
        setError(e instanceof Error ? e.message : "清空失敗");
      }
    });
  };

  const handleSaveScore = async (
    matchId: string,
    team1Score: number,
    team2Score: number,
  ) => {
    setError(null);
    await updateMatchScore(matchId, team1Score, team2Score);
    await loadDateData(matchDate);
  };

  const handleDelete = async (matchId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteMatch(matchId);
        await loadDateData(matchDate);
      } catch (e) {
        setError(e instanceof Error ? e.message : "刪除失敗");
      }
    });
  };

  const handleManualSubmit = async (
    team1: [string, string],
    team2: [string, string],
  ) => {
    setError(null);
    await createManualMatch(matchDate, team1, team2);
    await loadDateData(matchDate);
  };

  const handleExport = () => {
    if (matches.length === 0) {
      alert("目前沒有可匯出的對戰資料");
      return;
    }
    exportMatchesToExcel(matchDate, matches);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">比賽日期</label>
            <Input
              type="date"
              value={matchDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="relative">
            <Button
              variant="secondary"
              onClick={() => setShowHistory((v) => !v)}
            >
              <History className="h-4 w-4" />
              歷史日期
            </Button>
            {showHistory && historyDates.length > 0 && (
              <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-48 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {historyDates.map((date) => (
                  <button
                    key={date}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    onClick={() => {
                      handleDateChange(date);
                      setShowHistory(false);
                    }}
                  >
                    {date}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button onClick={handleExport}>
          <Download className="h-4 w-4" />
          匯出 Excel
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
            <p className="mt-1 text-xs">
              請確認已設定 .env.local 並在 Supabase 執行 migration。
            </p>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <PlayerChipGrid
          players={players}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
        />
        <MatchGenerator
          defaultCourtCount={settings?.default_court_count ?? 4}
          selectedCount={selectedIds.length}
          onGenerate={handleGenerate}
          onManualAdd={() => setShowManual(true)}
          onClearDay={handleClearDay}
          loading={isPending}
        />
      </div>

      <MatchTable
        matches={matches}
        onSaveScore={handleSaveScore}
        onDelete={handleDelete}
        loading={isPending}
      />

      {showManual && (
        <ManualMatchDialog
          players={players}
          selectedPlayerIds={selectedIds}
          onSubmit={handleManualSubmit}
          onClose={() => setShowManual(false)}
        />
      )}
    </div>
  );
}
