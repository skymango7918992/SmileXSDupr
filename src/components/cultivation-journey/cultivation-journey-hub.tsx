"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, Scroll } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { DemonsPanel } from "@/components/cultivation-journey/demons-panel";
import { CultivationRecordTimeline } from "@/components/cultivation-journey/record-timeline";
import { PracticeResultDialog } from "@/components/cultivation-journey/practice-result-dialog";
import { RealmProgressCard } from "@/components/cultivation-journey/realm-progress-card";
import { RetreatFormDialog } from "@/components/cultivation-journey/retreat-form-dialog";
import { SparringFormDialog } from "@/components/cultivation-journey/sparring-form-dialog";
import { TechniqueDetailPanel } from "@/components/cultivation-journey/technique-detail-panel";
import { TechniquesOverview } from "@/components/cultivation-journey/techniques-overview";
import { TrialFormDialog } from "@/components/cultivation-journey/trial-form-dialog";
import {
  createSparringRecord,
  createTrialRecord,
  deleteCultivationRecord,
  syncDuprSparringRecords,
} from "@/lib/actions/cultivation-journey";
import { createPracticeSession } from "@/lib/actions/technique-practice";
import { ADMIN_MANAGER_DUPR_ID } from "@/types/cultivation-journey";
import type { CultivationJourneyBundle } from "@/types/cultivation-journey";
import type {
  CreatePracticeSessionResult,
  PracticeLocationOption,
  TechniqueProgress,
} from "@/types/technique-practice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Tab = "overview" | "retreat" | "sparring" | "trial" | "techniques" | "demons";

const TABS: { id: Tab; label: string; short: string; icon: string }[] = [
  { id: "overview", label: "修行總覽", short: "總覽", icon: "📜" },
  { id: "techniques", label: "閉關功法", short: "功法", icon: "✨" },
  { id: "retreat", label: "閉關紀錄", short: "閉關", icon: "🧘" },
  { id: "sparring", label: "同門切磋", short: "切磋", icon: "⚔️" },
  { id: "trial", label: "天榜試煉", short: "試煉", icon: "⚡" },
  { id: "demons", label: "心魔清單", short: "心魔", icon: "👹" },
];

type Props = CultivationJourneyBundle & {
  techniqueProgress: TechniqueProgress[];
  practiceLocations: PracticeLocationOption[];
};

export function CultivationJourneyHub({
  profile,
  records,
  totalXp,
  techniqueProgress,
  practiceLocations,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("techniques");
  const [showRetreat, setShowRetreat] = useState(false);
  const [showSparring, setShowSparring] = useState(false);
  const [showTrial, setShowTrial] = useState(false);
  const [practiceResult, setPracticeResult] =
    useState<CreatePracticeSessionResult | null>(null);
  const [detailTechniqueId, setDetailTechniqueId] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const { success, error: toastError } = useAppUi();

  const stats = useMemo(() => {
    const retreat = records.filter((r) => r.record_type === "retreat").length;
    const sparring = records.filter((r) => r.record_type === "sparring").length;
    const trial = records.filter((r) => r.record_type === "trial").length;
    return { retreat, sparring, trial };
  }, [records]);

  const progressMap = useMemo(
    () => new Map(techniqueProgress.map((p) => [p.technique_id, p])),
    [techniqueProgress],
  );

  const refresh = useCallback(() => router.refresh(), [router]);

  const handleDelete = async (id: string) => {
    await deleteCultivationRecord(id);
    await refresh();
  };

  const handleSyncDupr = () => {
    startTransition(async () => {
      try {
        const { imported, skipped } = await syncDuprSparringRecords();
        success(`已匯入 ${imported} 場 DUPR 切磋（略過 ${skipped} 場）`);
        await refresh();
      } catch (e) {
        toastError(e instanceof Error ? e.message : "匯入失敗");
      }
    });
  };

  const handlePracticeSubmit = async (
    input: Parameters<typeof createPracticeSession>[0],
  ) => {
    try {
      const result = await createPracticeSession(input);
      setShowRetreat(false);
      setPracticeResult(result);
      await refresh();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "閉關紀錄失敗");
      throw e;
    }
  };

  return (
    <div className="cultivation-journey w-full min-w-0 max-w-full space-y-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-6">
      <header className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <Scroll className="h-5 w-5 shrink-0 text-amber-600" />
          <h1 className="text-xl font-semibold text-foreground">修行軌跡</h1>
        </div>
        <p className="text-sm text-muted text-pretty">
          平常練球即閉關修煉 · 16 項功法熟練度 0～100
          <span className="hidden sm:inline"> · 不進 DUPR 上傳</span>
        </p>
      </header>

      <RealmProgressCard totalXp={totalXp} recordCount={records.length} />

      <nav
        className="cj-scroll-tabs -mx-1 overflow-x-auto px-1 pb-1 lg:hidden"
        role="tablist"
        aria-label="修行分類"
      >
        <div className="flex w-max min-w-full gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "btn-touch flex min-w-[4.25rem] shrink-0 flex-col items-center gap-0.5 rounded-xl px-2.5 py-2 text-center",
                tab === t.id ? "glass-nav-active" : "cj-tab",
              )}
            >
              <span>{t.icon}</span>
              <span className="text-[10px] font-semibold">{t.short}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="min-w-0 lg:grid lg:grid-cols-[minmax(11rem,13rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <nav className="hidden lg:sticky lg:top-20 lg:block" role="tablist">
          <ul className="space-y-1">
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "btn-touch flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold",
                    tab === t.id ? "glass-nav-active" : "cj-tab",
                  )}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div role="tabpanel" className="min-w-0 space-y-4">
          {tab === "overview" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <StatPill label="閉關" value={stats.retreat} />
                <StatPill label="切磋" value={stats.sparring} />
                <StatPill label="試煉" value={stats.trial} />
              </div>
              <section>
                <h3 className="cj-section-title mb-2">近期修行紀錄</h3>
                <CultivationRecordTimeline
                  records={records.slice(0, 8)}
                  onDelete={handleDelete}
                  disabled={isPending}
                />
              </section>
            </>
          )}

          {tab === "techniques" && (
            <>
              <Button onClick={() => setShowRetreat(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                新增閉關修煉
              </Button>
              <TechniquesOverview
                progressList={techniqueProgress}
                onSelect={setDetailTechniqueId}
              />
            </>
          )}

          {tab === "retreat" && (
            <>
              <Button onClick={() => setShowRetreat(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                新增閉關修煉
              </Button>
              <p className="text-xs cj-muted">
                閉關紀錄不可刪除（MVP），以免熟練度計算錯亂。
              </p>
              <CultivationRecordTimeline
                records={records}
                filter="retreat"
                disabled={isPending}
              />
            </>
          )}

          {tab === "sparring" && (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button onClick={() => setShowSparring(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  友誼賽紀錄
                </Button>
                <Button
                  variant="secondary"
                  loading={isPending}
                  onClick={handleSyncDupr}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  <span className="truncate">匯入 DUPR（{ADMIN_MANAGER_DUPR_ID}）</span>
                </Button>
              </div>
              <CultivationRecordTimeline
                records={records}
                filter="sparring"
                onDelete={handleDelete}
                disabled={isPending}
              />
            </>
          )}

          {tab === "trial" && (
            <>
              <Button onClick={() => setShowTrial(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                新增試煉紀錄
              </Button>
              <CultivationRecordTimeline
                records={records}
                filter="trial"
                onDelete={handleDelete}
                disabled={isPending}
              />
            </>
          )}

          {tab === "demons" && <DemonsPanel profile={profile} />}
        </div>
      </div>

      <div className="cj-dock fixed z-20 flex gap-2 rounded-xl border border-border p-1.5 shadow-lg backdrop-blur-sm lg:hidden">
        <Button size="sm" className="flex-1" onClick={() => setShowRetreat(true)}>
          閉關
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="flex-1"
          onClick={() => setTab("techniques")}
        >
          功法
        </Button>
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => setShowSparring(true)}>
          切磋
        </Button>
      </div>

      {showRetreat && (
        <RetreatFormDialog
          locations={practiceLocations}
          onSubmit={handlePracticeSubmit}
          onClose={() => setShowRetreat(false)}
        />
      )}
      {showSparring && (
        <SparringFormDialog
          locations={practiceLocations}
          onSubmit={async (input) => {
            await createSparringRecord(input);
            await refresh();
            setShowSparring(false);
          }}
          onClose={() => setShowSparring(false)}
        />
      )}
      {showTrial && (
        <TrialFormDialog
          locations={practiceLocations}
          onSubmit={async (input) => {
            await createTrialRecord(input);
            await refresh();
            setShowTrial(false);
          }}
          onClose={() => setShowTrial(false)}
        />
      )}
      {practiceResult && (
        <PracticeResultDialog
          result={practiceResult}
          onClose={() => setPracticeResult(null)}
        />
      )}
      {detailTechniqueId && progressMap.get(detailTechniqueId) && (
        <TechniqueDetailPanel
          techniqueId={detailTechniqueId}
          progress={progressMap.get(detailTechniqueId)!}
          onClose={() => setDetailTechniqueId(null)}
        />
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="cj-stat-pill">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
