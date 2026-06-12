"use client";

import { useMemo, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { createCheckInFromPaste } from "@/lib/actions/checkin";
import {
  groupAttendeesByCategory,
  parseRegistrationText,
} from "@/lib/checkin-parser";
import type { SportType } from "@/types/checkin";
import { CATEGORY_LABELS, SPORT_LABELS } from "@/types/checkin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toISODate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  onCreated: (eventId: string) => void;
};

function NameChips({ names, color }: { names: string[]; color: string }) {
  if (!names.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {names.map((name) => (
        <span
          key={name}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-medium",
            color,
          )}
        >
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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const preview = useMemo(() => {
    if (!rawText.trim()) return null;
    return parseRegistrationText(rawText, sportType);
  }, [rawText, sportType]);

  const groups = preview ? groupAttendeesByCategory(preview.attendees) : null;

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      try {
        const id = await createCheckInFromPaste(rawText, sportType, {
          eventDate,
          title: title || undefined,
          feeAmount: parseInt(feeAmount, 10) || 200,
        });
        setRawText("");
        onCreated(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "建立失敗");
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-b from-white to-emerald-50/30 shadow-lg">
      <div className="border-b border-emerald-100/80 bg-white/80 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-bold text-slate-900">建立今日報到</h2>
        <p className="mt-1 text-sm text-slate-500">
          貼名單即可 · 空一行上方打球、下方練球
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
                "min-h-12 rounded-2xl text-sm font-bold transition",
                sportType === sport
                  ? "bg-emerald-700 text-white shadow-md"
                  : "bg-white text-slate-600 ring-1 ring-slate-200",
              )}
            >
              {SPORT_LABELS[sport]}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">
              日期
            </label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="min-h-12 rounded-2xl"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">
              球費 / 人
            </label>
            <Input
              type="number"
              min={0}
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              className="min-h-12 rounded-2xl"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            活動名稱（選填）
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：6/12 鳳山奧本羽球"
            className="min-h-12 rounded-2xl"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            貼上名單
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`1.靖峰   2.一芳\n3.龍     4.翊庭\n...\n\n（空一行）\n\n1.芳寧   2.秀敏\n3.芃鈞   4.俊彬友`}
            className="min-h-44 w-full rounded-2xl border-0 bg-white px-4 py-3 text-sm leading-relaxed shadow-inner ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <p className="mt-2 text-xs text-slate-400">
            也可貼完整 LINE 報名文，會自動辨識歡樂區／練球區
          </p>
        </div>

        {groups && preview && preview.attendees.length > 0 && (
          <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              已辨識 {preview.attendees.length} 人
            </div>
            {groups.play.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold text-emerald-700">
                  {CATEGORY_LABELS.play} {groups.play.length}
                </p>
                <NameChips
                  names={groups.play.map((a) => a.name)}
                  color="bg-emerald-100 text-emerald-800"
                />
              </div>
            )}
            {groups.practice.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold text-blue-700">
                  {CATEGORY_LABELS.practice} {groups.practice.length}
                </p>
                <NameChips
                  names={groups.practice.map((a) => a.name)}
                  color="bg-blue-100 text-blue-800"
                />
              </div>
            )}
            {(groups.waitlist_play.length > 0 ||
              groups.waitlist_practice.length > 0) && (
              <div>
                <p className="mb-2 text-xs font-bold text-amber-700">候補</p>
                <NameChips
                  names={[
                    ...groups.waitlist_play,
                    ...groups.waitlist_practice,
                  ].map((a) => a.name)}
                  color="bg-amber-100 text-amber-800"
                />
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button
          className="min-h-14 w-full rounded-2xl text-base font-bold"
          loading={pending}
          disabled={!rawText.trim() || !eventDate}
          onClick={handleSubmit}
        >
          開始收款
        </Button>
      </div>
    </div>
  );
}
