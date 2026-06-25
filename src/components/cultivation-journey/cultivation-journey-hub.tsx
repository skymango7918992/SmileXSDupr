"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, Scroll } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { CultivationRecordTimeline } from "@/components/cultivation-journey/record-timeline";
import { RealmProgressCard } from "@/components/cultivation-journey/realm-progress-card";
import { RetreatFormDialog } from "@/components/cultivation-journey/retreat-form-dialog";
import { SkillsDemonsPanel } from "@/components/cultivation-journey/skills-demons-panel";
import { SparringFormDialog } from "@/components/cultivation-journey/sparring-form-dialog";
import { TrialFormDialog } from "@/components/cultivation-journey/trial-form-dialog";
import {
  createRetreatRecord,
  createSparringRecord,
  createTrialRecord,
  deleteCultivationRecord,
  syncDuprSparringRecords,
} from "@/lib/actions/cultivation-journey";
import { ADMIN_MANAGER_DUPR_ID } from "@/types/cultivation-journey";
import type { CultivationJourneyBundle } from "@/types/cultivation-journey";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Tab = "overview" | "retreat" | "sparring" | "trial" | "skills";

const TABS: { id: Tab; label: string; short: string; icon: string }[] = [
  { id: "overview", label: "修行總覽", short: "總覽", icon: "📜" },
  { id: "retreat", label: "閉關練球", short: "閉關", icon: "🧘" },
  { id: "sparring", label: "同門切磋", short: "切磋", icon: "⚔️" },
  { id: "trial", label: "天榜試煉", short: "試煉", icon: "⚡" },
  { id: "skills", label: "功法心魔", short: "功法", icon: "✨" },
];

type Props = CultivationJourneyBundle;

export function CultivationJourneyHub({ profile, records, totalXp }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [showRetreat, setShowRetreat] = useState(false);
  const [showSparring, setShowSparring] = useState(false);
  const [showTrial, setShowTrial] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { success, error: toastError } = useAppUi();

  const stats = useMemo(() => {
    const retreat = records.filter((r) => r.record_type === "retreat").length;
    const sparring = records.filter((r) => r.record_type === "sparring").length;
    const trial = records.filter((r) => r.record_type === "trial").length;
    return { retreat, sparring, trial };
  }, [records]);

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

  return (
    <div className="cultivation-journey space-y-4 pb-20 lg:pb-6">
      <header>
        <div className="mb-1 flex items-center gap-2">
          <Scroll className="h-5 w-5 text-amber-600" />
          <h1 className="text-xl font-semibold">修行軌跡</h1>
        </div>
        <p className="text-sm text-muted">
          從凡人走向球道大帝 · 閉關、切磋、試煉，皆入修行冊
        </p>
      </header>

      <RealmProgressCard totalXp={totalXp} recordCount={records.length} />

      {/* 手機：底部式橫向分頁 */}
      <nav className="overflow-x-auto lg:hidden" role="tablist" aria-label="修行分類">
        <div className="flex min-w-min gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "btn-touch flex min-w-[4.5rem] shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-center",
                tab === t.id
                  ? "glass-nav-active"
                  : "border border-border bg-surface",
              )}
            >
              <span>{t.icon}</span>
              <span className="text-[10px] font-semibold">{t.short}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-5">
        {/* 桌面：左側導覽 */}
        <nav className="hidden lg:block" role="tablist">
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
                    tab === t.id
                      ? "glass-nav-active"
                      : "text-muted hover:bg-surface-muted",
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
                <h3 className="mb-2 text-sm font-semibold">近期修行紀錄</h3>
                <CultivationRecordTimeline
                  records={records.slice(0, 8)}
                  onDelete={handleDelete}
                  disabled={isPending}
                />
              </section>
            </>
          )}

          {tab === "retreat" && (
            <>
              <Button onClick={() => setShowRetreat(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                新增閉關紀錄
              </Button>
              <CultivationRecordTimeline
                records={records}
                filter="retreat"
                onDelete={handleDelete}
                disabled={isPending}
              />
            </>
          )}

          {tab === "sparring" && (
            <>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setShowSparring(true)}>
                  <Plus className="h-4 w-4" />
                  友誼賽紀錄
                </Button>
                <Button
                  variant="secondary"
                  loading={isPending}
                  onClick={handleSyncDupr}
                >
                  <Download className="h-4 w-4" />
                  匯入 DUPR（{ADMIN_MANAGER_DUPR_ID}）
                </Button>
              </div>
              <p className="text-xs text-muted">
                自動匯入星鑽 XS 與協會中，DUPR ID 為 {ADMIN_MANAGER_DUPR_ID} 的已完成對戰。
              </p>
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

          {tab === "skills" && <SkillsDemonsPanel profile={profile} />}
        </div>
      </div>

      {/* 手機：快捷新增 */}
      <div className="fixed bottom-3 left-3 right-3 z-20 flex gap-2 rounded-xl border border-border bg-surface/95 p-1.5 shadow-lg backdrop-blur-sm lg:hidden">
        <Button size="sm" className="flex-1" onClick={() => setShowRetreat(true)}>
          閉關
        </Button>
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => setShowSparring(true)}>
          切磋
        </Button>
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => setShowTrial(true)}>
          試煉
        </Button>
      </div>

      {showRetreat && (
        <RetreatFormDialog
          onSubmit={async (input) => {
            await createRetreatRecord(input);
            await refresh();
          }}
          onClose={() => setShowRetreat(false)}
        />
      )}
      {showSparring && (
        <SparringFormDialog
          onSubmit={async (input) => {
            await createSparringRecord(input);
            await refresh();
          }}
          onClose={() => setShowSparring(false)}
        />
      )}
      {showTrial && (
        <TrialFormDialog
          onSubmit={async (input) => {
            await createTrialRecord(input);
            await refresh();
          }}
          onClose={() => setShowTrial(false)}
        />
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted/50 px-3 py-2 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}
