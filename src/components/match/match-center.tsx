"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CalendarDays, Download, History, Sparkles, Users } from "lucide-react";
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

  const completedCount = matches.filter((m) => m.status === "completed").length;

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
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-6 shadow-[0_30px_80px_rgba(15,77,60,0.12)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-amber-200/40 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <Sparkles className="h-3.5 w-3.5" />
              專業 DUPR 賽事控台
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {settings?.team_name ?? "匹克球隊"} · 今日賽程
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              智慧排程優先配對較少一起上場的隊友組合
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-center shadow-sm">
              <Users className="mx-auto mb-1 h-4 w-4 text-emerald-700" />
              <p className="text-lg font-bold text-slate-900">{selectedIds.length}</p>
              <p className="text-xs text-slate-500">到場球員</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-center shadow-sm">
              <CalendarDays className="mx-auto mb-1 h-4 w-4 text-emerald-700" />
              <p className="text-lg font-bold text-slate-900">{matches.length}</p>
              <p className="text-xs text-slate-500">今日場次</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-center shadow-sm">
              <Sparkles className="mx-auto mb-1 h-4 w-4 text-amber-600" />
              <p className="text-lg font-bold text-slate-900">{completedCount}</p>
              <p className="text-xs text-slate-500">已完成</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              比賽日期
            </label>
            <Input
              type="date"
              value={matchDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-44 border-slate-200 bg-white"
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
              <div className="absolute left-0 top-full z-20 mt-2 max-h-48 w-52 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-xl">
                {historyDates.map((date) => (
                  <button
                    key={date}
                    type="button"
                    className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-emerald-50"
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

        <Button onClick={handleExport} className="shadow-lg shadow-emerald-900/15">
          <Download className="h-4 w-4" />
          匯出 Excel
        </Button>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <PlayerChipGrid
          players={players}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          cardClassName="border-white/70 bg-white/85 shadow-[0_20px_50px_rgba(15,77,60,0.08)] backdrop-blur"
        />
        <MatchGenerator
          defaultCourtCount={settings?.default_court_count ?? 4}
          selectedCount={selectedIds.length}
          onGenerate={handleGenerate}
          onManualAdd={() => setShowManual(true)}
          onClearDay={handleClearDay}
          loading={isPending}
          cardClassName="border-white/70 bg-white/85 shadow-[0_20px_50px_rgba(15,77,60,0.08)] backdrop-blur"
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
