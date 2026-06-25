"use client";

import { useEffect, useState } from "react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import {
  CULTIVATION_SKILLS,
  type CultivationSkillId,
} from "@/types/cultivation-journey";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  onSubmit: (input: {
    occurred_on: string;
    venue_name: string;
    duration_minutes: number;
    practice_skills: CultivationSkillId[];
    self_rating: number;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
};

export function RetreatFormDialog({ onSubmit, onClose }: Props) {
  const [occurredOn, setOccurredOn] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [venue, setVenue] = useState("");
  const [duration, setDuration] = useState("60");
  const [skills, setSkills] = useState<CultivationSkillId[]>([]);
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { error: toastError, success } = useAppUi();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const toggleSkill = (id: CultivationSkillId) => {
    setSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    if (!venue.trim()) {
      toastError("請填寫閉關地點");
      return;
    }
    const mins = Number(duration);
    if (Number.isNaN(mins) || mins < 1) {
      toastError("請輸入有效練球時長");
      return;
    }
    if (skills.length === 0) {
      toastError("請至少選一項功法練習");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        occurred_on: occurredOn,
        venue_name: venue,
        duration_minutes: mins,
        practice_skills: skills,
        self_rating: rating,
        notes,
      });
      success("閉關紀錄已存入修行冊");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormShell title="閉關練球" subtitle="不需比分，專注修煉" onClose={onClose}>
      <Field label="日期">
        <Input type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} className="h-11" />
      </Field>
      <Field label="地點">
        <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="例：羽懿球場" className="h-11" />
      </Field>
      <Field label="練球時長（分鐘）">
        <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} className="h-11" />
        <p className="mt-1 text-[11px] text-muted">滿 60 分鐘額外 +15 修為</p>
      </Field>
      <Field label="今日功法">
        <div className="grid grid-cols-2 gap-1.5">
          {CULTIVATION_SKILLS.map((skill) => {
            const on = skills.includes(skill.id);
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill.id)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-left text-xs transition-colors",
                  on
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-surface-muted",
                )}
              >
                <span className="font-semibold">{skill.label}</span>
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="自我評分">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={cn(
                "btn-touch flex-1 rounded-lg border py-2 text-sm font-semibold",
                rating === n
                  ? "border-amber-500 bg-amber-500/15 text-amber-800"
                  : "border-border",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </Field>
      <Field label="心得（選填）">
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="今日閉關感悟…" className="h-11" />
      </Field>
      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} className="flex-1">取消</Button>
        <Button onClick={() => void handleSubmit()} loading={loading} className="flex-1">完成閉關</Button>
      </div>
    </FormShell>
  );
}

function FormShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <div className="glass-overlay absolute inset-0" aria-hidden onClick={onClose} />
      <Card className="glass-modal relative flex max-h-[min(96dvh,100%)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl">
        <div className="shrink-0 border-b border-divider px-4 py-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">{children}</div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-muted">{label}</p>
      {children}
    </div>
  );
}
