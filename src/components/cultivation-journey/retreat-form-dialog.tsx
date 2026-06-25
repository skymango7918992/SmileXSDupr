"use client";

import { useEffect, useState } from "react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import {
  PICKLEBALL_TECHNIQUES,
  PRACTICE_MOODS,
} from "@/lib/pickleball-techniques";
import type { PracticeLocationOption } from "@/types/technique-practice";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  locations: PracticeLocationOption[];
  onSubmit: (input: {
    practiceDate: string;
    locationId: string;
    locationName: string;
    durationMinutes: number;
    techniqueIds: string[];
    selfRating?: number;
    hasImprovement?: boolean;
    note?: string;
    mood?: string;
  }) => Promise<void>;
  onClose: () => void;
};

export function RetreatFormDialog({ locations, onSubmit, onClose }: Props) {
  const [practiceDate, setPracticeDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [locationId, setLocationId] = useState(
    locations[0]?.id ?? "custom",
  );
  const [customLocation, setCustomLocation] = useState("");
  const [duration, setDuration] = useState("60");
  const [techniqueIds, setTechniqueIds] = useState<string[]>([]);
  const [rating, setRating] = useState<number | undefined>(3);
  const [hasImprovement, setHasImprovement] = useState(false);
  const [note, setNote] = useState("");
  const [mood, setMood] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const { error: toastError } = useAppUi();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const toggleTechnique = (id: string) => {
    setTechniqueIds((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 3) {
        toastError("每次閉關最多選擇 3 項功法，請專心修煉，切勿貪多。");
        return prev;
      }
      return [...prev, id];
    });
  };

  const resolveLocationName = () => {
    if (locationId === "custom") return customLocation.trim();
    return locations.find((l) => l.id === locationId)?.name ?? customLocation.trim();
  };

  const handleSubmit = async () => {
    const locationName = resolveLocationName();
    if (!locationName) {
      toastError("請選擇或填寫練球地點");
      return;
    }
    const mins = Number(duration);
    if (Number.isNaN(mins) || mins <= 0) {
      toastError("請輸入有效練習時間");
      return;
    }
    if (techniqueIds.length < 1) {
      toastError("請至少選擇 1 項本次閉關功法。");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        practiceDate,
        locationId,
        locationName,
        durationMinutes: mins,
        techniqueIds,
        selfRating: rating,
        hasImprovement,
        note: note.trim() || undefined,
        mood,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cultivation-journey fixed inset-0 z-50 flex flex-col justify-end border-0 bg-transparent p-0 shadow-none sm:items-center sm:justify-center">
      <div className="cj-modal-overlay absolute inset-0" aria-hidden onClick={onClose} />
      <Card className="cj-modal glass-modal relative flex max-h-[min(96dvh,100%)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl sm:max-h-[min(90dvh,720px)] sm:rounded-2xl">
        <div className="cj-modal-header shrink-0 px-4 py-3">
          <CardTitle className="text-base">新增閉關修煉紀錄</CardTitle>
          <p className="text-xs cj-modal-muted">選 1～3 項功法 · 不進 DUPR 上傳</p>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          <Field label="閉關日期">
            <Input type="date" value={practiceDate} onChange={(e) => setPracticeDate(e.target.value)} className="cj-input h-11" />
          </Field>

          <Field label="練球地點">
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="cj-input"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            {locationId === "custom" && (
              <Input
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="輸入地點名稱"
                className="cj-input mt-2 h-11"
              />
            )}
          </Field>

          <Field label="練習時間（分鐘）">
            <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} className="cj-input h-11" />
            <p className="mt-1 text-[11px] cj-modal-muted">&lt;30 +2 · 30～59 +5 · 60+ +8（每功法）</p>
          </Field>

          <Field label="今日閉關功法（1～3 項）">
            <div className="cj-technique-list">
              {PICKLEBALL_TECHNIQUES.map((t) => {
                const on = techniqueIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTechnique(t.id)}
                    className={cn("cj-technique-option", on && "is-selected")}
                  >
                    <span
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 rounded border",
                        on ? "border-emerald-500 bg-emerald-500" : "border-border",
                      )}
                    />
                    <span>
                      <span className="font-semibold">{t.name}</span>
                      <span className="cj-modal-muted">｜{t.shot}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] cj-modal-muted">已選 {techniqueIds.length} / 3</p>
          </Field>

          <Field label="自我評分（選填）">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={cn(
                    "btn-touch flex-1 rounded-lg border py-2 text-sm font-semibold",
                    rating === n
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-border cj-modal-muted",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] cj-modal-muted">4 分以上每功法額外 +2</p>
          </Field>

          <label className="flex items-center gap-2 text-sm cj-modal-body">
            <input
              type="checkbox"
              checked={hasImprovement}
              onChange={(e) => setHasImprovement(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--cj-border-soft)]"
            />
            本次有明顯進步（每功法 +3）
          </label>

          <Field label="今日狀態（選填）">
            <div className="flex flex-wrap gap-1.5">
              {PRACTICE_MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(mood === m ? undefined : m)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    mood === m
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                      : "border-border cj-modal-muted",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </Field>

          <Field label="心得備註（選填，有填每功法 +2）">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="今日閉關感悟…" className="cj-input h-11" />
          </Field>
        </div>

        <div className="cj-modal-header shrink-0 flex gap-2 border-t p-4">
          <Button variant="secondary" onClick={onClose} className="flex-1">取消</Button>
          <Button onClick={() => void handleSubmit()} loading={loading} className="flex-1">完成閉關</Button>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="cj-field-label">{label}</p>
      {children}
    </div>
  );
}
