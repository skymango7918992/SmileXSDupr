"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import { createCheckInFromPaste } from "@/lib/actions/checkin";
import {
  groupAttendeesByCategory,
  mergeAttendeesDedupe,
  parseRegistrationText,
  type ParsedAttendee,
} from "@/lib/checkin-parser";
import type { AttendeeCategory, SportType } from "@/types/checkin";
import { CATEGORY_LABELS, SPORT_LABELS } from "@/types/checkin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toISODate, cn } from "@/lib/utils";

type Props = {
  onCreated: (eventId: string) => void;
};

const MANUAL_CATEGORIES: AttendeeCategory[] = [
  "play",
  "practice",
  "waitlist_play",
];

function NameChips({ names, tagClass }: { names: string[]; tagClass: string }) {
  if (!names.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {names.map((name) => (
        <span key={name} className={cn("tag", tagClass)}>
          {name}
        </span>
      ))}
    </div>
  );
}

export function CreateCheckInForm({ onCreated }: Props) {
  const [rawText, setRawText] = useState("");
  const [sportType, setSportType] = useState<SportType>("badminton");
  const [eventDate, setEventDate] = useState(toISODate(new Date()));
  const [title, setTitle] = useState("");
  const [feeAmount, setFeeAmount] = useState("200");
  const [manualAttendees, setManualAttendees] = useState<ParsedAttendee[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] =
    useState<AttendeeCategory>("play");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const preview = useMemo(() => {
    if (!rawText.trim()) return null;
    return parseRegistrationText(rawText, sportType);
  }, [rawText, sportType]);

  const allAttendees = useMemo(
    () => mergeAttendeesDedupe(preview?.attendees ?? [], manualAttendees),
    [preview, manualAttendees],
  );

  const groups = allAttendees.length
    ? groupAttendeesByCategory(allAttendees)
    : null;

  const addManualPerson = () => {
    const name = manualName.trim();
    if (!name) return;
    const exists = allAttendees.some(
      (a) => a.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (exists) {
      setError(`「${name}」已在名單中`);
      return;
    }
    setError(null);
    setManualAttendees((prev) => [
      ...prev,
      { name, category: manualCategory, listNumber: null },
    ]);
    setManualName("");
  };

  const removeManualPerson = (name: string) => {
    setManualAttendees((prev) => prev.filter((a) => a.name !== name));
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      try {
        const id = await createCheckInFromPaste(rawText, sportType, {
          eventDate,
          title: title || undefined,
          feeAmount: parseInt(feeAmount, 10) || 200,
          extraAttendees: manualAttendees,
        });
        setRawText("");
        setManualAttendees([]);
        onCreated(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "建立失敗");
      }
    });
  };

  return (
    <div className="glass-card overflow-hidden p-0">
      <div className="border-b border-border bg-surface-muted/30 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-foreground">建立今日報到</h2>
        <p className="mt-1 text-sm text-muted">
          貼名單後可再手動補人 · 空一行上方打球、下方練球
        </p>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-2">
          {(["badminton", "pickleball"] as SportType[]).map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => setSportType(sport)}
              className={cn(
                "min-h-12 cursor-pointer rounded-[10px] text-sm font-medium transition-colors",
                sportType === sport
                  ? "glass-nav-active text-foreground"
                  : "border border-border bg-surface text-muted hover:bg-surface-muted/40",
              )}
            >
              {SPORT_LABELS[sport]}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
              日期
            </label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="min-h-12"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
              球費 / 人
            </label>
            <Input
              type="number"
              min={0}
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              className="min-h-12"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">
            活動名稱（選填）
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：6/12 鳳山奧本羽球"
            className="min-h-12"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">
            貼上名單
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`1.靖峰   2.一芳\n3.龍     4.翊庭\n...\n\n（空一行）\n\n1.芳寧   2.秀敏\n3.芃鈞   4.俊彬友`}
            className="glass-input min-h-44 w-full rounded-[10px] px-4 py-3 text-sm leading-relaxed text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-2 text-xs text-muted/70">
            也可貼完整 LINE 報名文，會自動辨識歡樂區／練球區
          </p>
        </div>

        <div className="rounded-[12px] border border-border bg-surface-muted/25 p-4">
          <p className="mb-2 text-xs font-medium text-muted">手動新增人員</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {MANUAL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setManualCategory(cat)}
                className={cn(
                  "cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  manualCategory === cat
                    ? "border-primary/30 bg-primary-soft text-primary"
                    : "border-border bg-surface text-muted hover:bg-surface-muted",
                )}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="輸入姓名"
              className="min-h-10 flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addManualPerson();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={addManualPerson}
              disabled={!manualName.trim()}
            >
              <Plus className="h-4 w-4" />
              新增
            </Button>
          </div>
          {manualAttendees.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {manualAttendees.map((a) => (
                <span
                  key={a.name}
                  className="tag tag-neutral inline-flex items-center gap-1 pr-1"
                >
                  {a.name}
                  <span className="text-[10px] text-muted">
                    ({CATEGORY_LABELS[a.category]})
                  </span>
                  <button
                    type="button"
                    onClick={() => removeManualPerson(a.name)}
                    className="cursor-pointer rounded p-0.5 hover:bg-surface-muted"
                    aria-label={`移除 ${a.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {groups && allAttendees.length > 0 && (
          <div className="space-y-3 rounded-[12px] border border-border bg-surface-muted/25 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              共 {allAttendees.length} 人
              {manualAttendees.length > 0 && (
                <span className="text-xs font-normal text-muted">
                  （含手動 {manualAttendees.length} 人）
                </span>
              )}
            </div>
            {groups.play.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-primary">
                  {CATEGORY_LABELS.play} {groups.play.length}
                </p>
                <NameChips
                  names={groups.play.map((a) => a.name)}
                  tagClass="tag-primary"
                />
              </div>
            )}
            {groups.practice.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-info">
                  {CATEGORY_LABELS.practice} {groups.practice.length}
                </p>
                <NameChips
                  names={groups.practice.map((a) => a.name)}
                  tagClass="tag-info"
                />
              </div>
            )}
            {(groups.waitlist_play.length > 0 ||
              groups.waitlist_practice.length > 0) && (
              <div>
                <p className="mb-2 text-xs font-medium text-warning">候補</p>
                <NameChips
                  names={[
                    ...groups.waitlist_play,
                    ...groups.waitlist_practice,
                  ].map((a) => a.name)}
                  tagClass="tag-warning"
                />
              </div>
            )}
          </div>
        )}

        {error && <p className="alert-danger">{error}</p>}

        <Button
          className="min-h-12 w-full text-base"
          loading={pending}
          disabled={allAttendees.length === 0 || !eventDate}
          onClick={handleSubmit}
        >
          開始收款
        </Button>
      </div>
    </div>
  );
}
