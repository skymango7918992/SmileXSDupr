"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  CalendarDays,
  Download,
  History,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import {
  addLatePlayerAndReschedule,
  clearSessionMatches,
  createManualMatch,
  createSession,
  deleteMatch,
  deleteSession,
  generateMatchesForSession,
  getMatchDates,
  getMatchesForSession,
  getSessionPlayers,
  getSessionsForDate,
  updateMatchScore,
  updateSessionRoster,
} from "@/lib/actions/sessions";
import { exportMatchesToDuprCsv } from "@/lib/export-dupr-csv";
import type {
  AppSettings,
  MatchWithPlayers,
  Player,
  ScheduleSessionWithStats,
} from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LateJoinDialog } from "@/components/match/late-join-dialog";
import { ManualMatchDialog } from "@/components/match/manual-match-dialog";
import { MatchGenerator } from "@/components/match/match-generator";
import { MatchTable } from "@/components/match/match-table";
import { PlayerChipGrid } from "@/components/match/player-chip-grid";
import { SessionTabs } from "@/components/match/session-tabs";

type Props = {
  players: Player[];
  initialMatchDate: string;
  initialSessions: ScheduleSessionWithStats[];
  initialSessionId: string | null;
  initialMatches: MatchWithPlayers[];
  initialSelectedIds: string[];
  settings: AppSettings | null;
};

export function MatchCenter({
  players,
  initialMatchDate,
  initialSessions,
  initialSessionId,
  initialMatches,
  initialSelectedIds,
  settings,
}: Props) {
  const [matchDate, setMatchDate] = useState(initialMatchDate);
  const [sessions, setSessions] = useState(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessionId,
  );
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  const [matches, setMatches] = useState(initialMatches);
  const [historyDates, setHistoryDates] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showLateJoin, setShowLateJoin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const completedCount = matches.filter((m) => m.status === "completed").length;
  const maxCompletedRound = matches
    .filter((m) => m.status === "completed")
    .reduce((max, m) => Math.max(max, m.round_number), 0);

  const loadSessionData = useCallback(async (sessionId: string) => {
    const [matchList, roster] = await Promise.all([
      getMatchesForSession(sessionId),
      getSessionPlayers(sessionId),
    ]);
    setMatches(matchList);
    setSelectedIds(roster.map((r) => r.player_id));
    return matchList;
  }, []);

  const loadDateData = useCallback(
    async (date: string, keepSessionId?: string | null) => {
      const sessionList = await getSessionsForDate(date);
      setSessions(sessionList);

      let sessionId = keepSessionId;
      if (!sessionId || !sessionList.some((s) => s.id === sessionId)) {
        sessionId = sessionList[0]?.id ?? null;
      }
      setActiveSessionId(sessionId);

      if (sessionId) {
        await loadSessionData(sessionId);
      } else {
        setMatches([]);
        setSelectedIds([]);
      }

      const dates = await getMatchDates();
      setHistoryDates(dates);
    },
    [loadSessionData],
  );

  useEffect(() => {
    void getMatchDates().then(setHistoryDates);
  }, []);

  const handleDateChange = (date: string) => {
    setMatchDate(date);
    setError(null);
    startTransition(async () => {
      try {
        await loadDateData(date);
      } catch (e) {
        setError(e instanceof Error ? e.message : "載入失敗");
      }
    });
  };

  const handleSessionSelect = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setError(null);
    startTransition(async () => {
      try {
        await loadSessionData(sessionId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "載入賽程失敗");
      }
    });
  };

  const handleCreateSession = () => {
    setError(null);
    startTransition(async () => {
      try {
        const session = await createSession(matchDate);
        await loadDateData(matchDate, session.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "建立賽程失敗");
      }
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteSession(sessionId);
        await loadDateData(matchDate);
      } catch (e) {
        setError(e instanceof Error ? e.message : "刪除賽程失敗");
      }
    });
  };

  const handleSelectionChange = (ids: string[]) => {
    if (!activeSessionId) return;
    setSelectedIds(ids);
    startTransition(async () => {
      try {
        await updateSessionRoster(activeSessionId, ids);
        const updated = await getSessionsForDate(matchDate);
        setSessions(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : "儲存名單失敗");
      }
    });
  };

  const handleGenerate = async (courtCount: number) => {
    if (!activeSessionId) return;
    setError(null);
    startTransition(async () => {
      try {
        await generateMatchesForSession(activeSessionId, courtCount);
        await loadSessionData(activeSessionId);
        const updated = await getSessionsForDate(matchDate);
        setSessions(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : "排場失敗");
      }
    });
  };

  const handleClearScheduled = async () => {
    if (!activeSessionId) return;
    setError(null);
    startTransition(async () => {
      try {
        await clearSessionMatches(activeSessionId);
        await loadSessionData(activeSessionId);
        const updated = await getSessionsForDate(matchDate);
        setSessions(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : "清空失敗");
      }
    });
  };

  const handleLateJoin = async (playerId: string, courtCount: number) => {
    if (!activeSessionId) return;
    setError(null);
    await addLatePlayerAndReschedule(activeSessionId, playerId, courtCount);
    await loadSessionData(activeSessionId);
    const updated = await getSessionsForDate(matchDate);
    setSessions(updated);
  };

  const handleSaveScore = async (
    matchId: string,
    team1Score: number,
    team2Score: number,
  ) => {
    if (!activeSessionId) return;
    setError(null);
    await updateMatchScore(matchId, team1Score, team2Score);
    await loadSessionData(activeSessionId);
    const updated = await getSessionsForDate(matchDate);
    setSessions(updated);
  };

  const handleDelete = async (matchId: string) => {
    if (!activeSessionId) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteMatch(matchId);
        await loadSessionData(activeSessionId);
        const updated = await getSessionsForDate(matchDate);
        setSessions(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : "刪除失敗");
      }
    });
  };

  const handleManualSubmit = async (
    team1: [string, string],
    team2: [string, string],
  ) => {
    if (!activeSessionId) return;
    setError(null);
    await createManualMatch(activeSessionId, team1, team2);
    await loadSessionData(activeSessionId);
    const updated = await getSessionsForDate(matchDate);
    setSessions(updated);
  };

  const handleExport = () => {
    if (matches.length === 0) {
      alert("目前沒有可匯出的對戰資料");
      return;
    }
    const label = activeSession?.name ?? "賽程";
    try {
      const { exported, skipped } = exportMatchesToDuprCsv(
        matchDate,
        matches,
        label,
      );
      if (skipped > 0) {
        alert(
          `已匯出 ${exported} 場已完成對戰（略過 ${skipped} 場尚未完成）`,
        );
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "匯出失敗");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-4 shadow-[0_30px_80px_rgba(15,77,60,0.12)] backdrop-blur-xl sm:p-6">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <Sparkles className="h-3.5 w-3.5" />
              星鑽 XS 賽事控台
            </p>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {settings?.team_name ?? "星鑽 XS 匹克球"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              多賽程組 · 晚到加入 · 智慧避重搭檔
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Stat icon={<Users className="h-4 w-4" />} value={selectedIds.length} label="到場" />
            <Stat icon={<CalendarDays className="h-4 w-4" />} value={matches.length} label="場次" />
            <Stat icon={<Sparkles className="h-4 w-4" />} value={completedCount} label="完成" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                比賽日期
              </label>
              <Input
                type="date"
                value={matchDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="min-h-11 w-full sm:w-44"
              />
            </div>
            <div className="relative">
              <Button variant="secondary" className="min-h-11" onClick={() => setShowHistory((v) => !v)}>
                <History className="h-4 w-4" />
                歷史
              </Button>
              {showHistory && historyDates.length > 0 && (
                <div className="absolute left-0 top-full z-20 mt-2 max-h-48 w-52 overflow-y-auto rounded-2xl border bg-white py-1 shadow-xl">
                  {historyDates.map((date) => (
                    <button
                      key={date}
                      type="button"
                      className="block w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50"
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
          <Button
            onClick={handleExport}
            disabled={!activeSessionId}
            className="min-h-11 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            匯出 DUPR CSV
          </Button>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <SessionTabs
            sessions={sessions}
            activeId={activeSessionId}
            onSelect={handleSessionSelect}
            onCreate={handleCreateSession}
            onDelete={handleDeleteSession}
            loading={isPending}
          />
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!activeSessionId ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
          請先新增賽程組
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
            <PlayerChipGrid
              players={players}
              selectedIds={selectedIds}
              onSelectionChange={handleSelectionChange}
              cardClassName="border-white/70 bg-white/85 backdrop-blur"
            />
            <div className="space-y-3">
              <MatchGenerator
                defaultCourtCount={settings?.default_court_count ?? 4}
                selectedCount={selectedIds.length}
                onGenerate={handleGenerate}
                onManualAdd={() => setShowManual(true)}
                onClearDay={handleClearScheduled}
                loading={isPending}
                cardClassName="border-white/70 bg-white/85 backdrop-blur"
              />
              <Button
                variant="outline"
                className="min-h-11 w-full"
                disabled={isPending || completedCount === 0}
                onClick={() => setShowLateJoin(true)}
              >
                <UserPlus className="h-4 w-4" />
                晚到加入（已完成 {maxCompletedRound} 場不動）
              </Button>
            </div>
          </div>

          <MatchTable
            matches={matches}
            onSaveScore={handleSaveScore}
            onDelete={handleDelete}
            loading={isPending}
            sessionName={activeSession?.name}
          />
        </>
      )}

      {showManual && activeSessionId && (
        <ManualMatchDialog
          players={players}
          selectedPlayerIds={selectedIds}
          onSubmit={handleManualSubmit}
          onClose={() => setShowManual(false)}
        />
      )}

      {showLateJoin && activeSessionId && (
        <LateJoinDialog
          players={players}
          sessionPlayerIds={selectedIds}
          completedRounds={maxCompletedRound}
          onSubmit={handleLateJoin}
          onClose={() => setShowLateJoin(false)}
        />
      )}
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/90 px-3 py-2 text-center shadow-sm sm:px-4 sm:py-3">
      <div className="mx-auto mb-1 text-emerald-700">{icon}</div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
