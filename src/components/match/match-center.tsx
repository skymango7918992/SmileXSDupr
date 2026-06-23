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
  updateSessionScoreType,
} from "@/lib/actions/sessions";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { exportMatchesToDuprCsv } from "@/lib/export-dupr-csv";
import { SCORE_TYPE_LABEL } from "@/lib/dupr-score-type";
import type {
  AppSettings,
  MatchWithPlayers,
  Player,
  ScheduleSessionWithStats,
  ScoreType,
} from "@/types/database";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/brand/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateSessionDialog } from "@/components/match/create-session-dialog";
import { LateJoinDialog } from "@/components/match/late-join-dialog";
import { ManualMatchDialog } from "@/components/match/manual-match-dialog";
import { MatchGenerator } from "@/components/match/match-generator";
import { MatchTable } from "@/components/match/match-table";
import { PlayerChipGrid } from "@/components/match/player-chip-grid";
import { SessionTabs } from "@/components/match/session-tabs";
import { SessionScorePicker } from "@/components/match/session-score-picker";

type Props = {
  players: Player[];
  initialMatchDate: string;
  initialSessions: ScheduleSessionWithStats[];
  initialSessionId: string | null;
  initialMatches: MatchWithPlayers[];
  initialSelectedIds: string[];
  settings: AppSettings | null;
  canDeleteMatches?: boolean;
};

export function MatchCenter({
  players,
  initialMatchDate,
  initialSessions,
  initialSessionId,
  initialMatches,
  initialSelectedIds,
  settings,
  canDeleteMatches = true,
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
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { error: toastError, success, info } = useAppUi();

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

  const handleCreateSession = (input: {
    name: string;
    scoreType: ScoreType;
  }) => {
    setError(null);
    startTransition(async () => {
      try {
        const session = await createSession(matchDate, {
          name: input.name || undefined,
          scoreType: input.scoreType,
        });
        setShowCreateSession(false);
        await loadDateData(matchDate, session.id);
        success(
          `已建立賽程（${SCORE_TYPE_LABEL[session.score_type ?? input.scoreType]}）`,
        );
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

  const handleSaveRoster = async (ids: string[]) => {
    if (!activeSessionId) return;
    setError(null);
    await updateSessionRoster(activeSessionId, ids);
    setSelectedIds(ids);
    const updated = await getSessionsForDate(matchDate);
    setSessions(updated);
    success("出席名單已儲存");
  };

  const handleScoreTypeChange = (scoreType: ScoreType) => {
    if (!activeSessionId) return;
    setError(null);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, score_type: scoreType } : s,
      ),
    );
    startTransition(async () => {
      try {
        await updateSessionScoreType(activeSessionId, scoreType);
        success(`已切換為${SCORE_TYPE_LABEL[scoreType]}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "更新計分制度失敗";
        setError(msg);
        toastError(msg);
        const updated = await getSessionsForDate(matchDate);
        setSessions(updated);
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
    try {
      await createManualMatch(activeSessionId, team1, team2);
      await loadSessionData(activeSessionId);
      const updated = await getSessionsForDate(matchDate);
      setSessions(updated);
      success("已手動新增對戰");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "新增失敗";
      setError(msg);
      toastError(msg);
      throw e;
    }
  };

  const handleExport = () => {
    if (matches.length === 0) {
      toastError("目前沒有可匯出的對戰資料");
      return;
    }
    const label = activeSession?.name ?? "賽程";
    try {
      const { exported, skipped } = exportMatchesToDuprCsv(
        matchDate,
        matches,
        {
          sessionName: label,
          scoreType: activeSession?.score_type ?? "rally",
        },
      );
      if (exported === 0) {
        info("沒有已完成的場次可匯出");
        return;
      }
      if (skipped > 0) {
        success(`已匯出 ${exported} 場（略過 ${skipped} 場未完成）`);
      } else {
        success(`已匯出 ${exported} 場 DUPR CSV`);
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : "匯出失敗");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHero variant="match" />

      <section className="glass-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="tag tag-neutral mb-2">
              <Sparkles className="mr-1 inline h-3 w-3" />
              星鑽 XS 賽事控台
            </span>
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              {settings?.team_name ?? "星鑽 XS 匹克球"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              多賽程組 · 晚到加入 · 智慧避重搭檔
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Stat
              icon={<Users className="h-4 w-4" />}
              value={selectedIds.length}
              label="到場"
              tone="accent"
            />
            <Stat
              icon={<CalendarDays className="h-4 w-4" />}
              value={matches.length}
              label="場次"
              tone="primary"
            />
            <Stat
              icon={<Sparkles className="h-4 w-4" />}
              value={completedCount}
              label="完成"
              tone="success"
            />
          </div>
        </div>
      </section>

      <section className="glass-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
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
                <div className="glass-popover absolute left-0 top-full z-20 mt-2 max-h-48 w-52 overflow-y-auto py-1">
                  {historyDates.map((date) => (
                    <button
                      key={date}
                      type="button"
                      className="block w-full cursor-pointer px-4 py-2.5 text-left text-sm hover:bg-surface-muted/50"
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

        <div className="mt-4 border-t border-border pt-4">
          <SessionTabs
            sessions={sessions}
            activeId={activeSessionId}
            onSelect={handleSessionSelect}
            onCreate={() => setShowCreateSession(true)}
            onDelete={canDeleteMatches ? handleDeleteSession : undefined}
            loading={isPending}
          />
        </div>
      </section>

      {error && (
        <div className="alert-danger px-4 py-3">{error}</div>
      )}

      {!activeSessionId ? (
        <div className="rounded-[14px] border border-dashed border-border py-12 text-center text-sm text-muted">
          請先新增賽程組
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
            <div className="space-y-3">
              <PlayerChipGrid
                players={players}
                selectedIds={selectedIds}
                onSave={async (ids) => {
                  try {
                    await handleSaveRoster(ids);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "儲存名單失敗");
                    toastError(e instanceof Error ? e.message : "儲存名單失敗");
                    throw e;
                  }
                }}
                cardClassName="min-h-[min(420px,55vh)]"
              />
              <SessionScorePicker
                value={activeSession?.score_type ?? "rally"}
                disabled={isPending}
                onChange={handleScoreTypeChange}
              />
            </div>
            <div className="space-y-3">
              <MatchGenerator
                defaultCourtCount={settings?.default_court_count ?? 4}
                selectedCount={selectedIds.length}
                onGenerate={handleGenerate}
                onManualAdd={() => setShowManual(true)}
                onClearDay={handleClearScheduled}
                loading={isPending}
                cardClassName=""
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
            canDelete={canDeleteMatches}
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

      {showCreateSession && (
        <CreateSessionDialog
          defaultName={`賽程 ${sessions.length + 1}`}
          onSubmit={handleCreateSession}
          onClose={() => setShowCreateSession(false)}
          loading={isPending}
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

const statTones = {
  accent: "border-border bg-surface text-foreground",
  primary: "border-border bg-primary-soft/40 text-primary",
  success: "border-border bg-surface text-success",
} as const;

function Stat({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: keyof typeof statTones;
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] border px-3 py-2 text-center sm:px-4 sm:py-3",
        statTones[tone],
      )}
    >
      <div className="mx-auto mb-1 opacity-90">{icon}</div>
      <p className="font-data text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs font-medium text-muted">{label}</p>
    </div>
  );
}
