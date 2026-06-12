"use client";

import { Pencil, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createSavedPlace,
  deleteSavedPlace,
  updateSavedPlace,
} from "@/lib/actions/play-saved-places";
import {
  JOURNEY_SPORT_LABELS,
  type JourneySport,
  type PlaySavedPlace,
} from "@/types/play-journey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  places: PlaySavedPlace[];
  onQuickRecord?: (place: PlaySavedPlace) => void;
};

const SPORTS: JourneySport[] = ["pickleball", "badminton"];

export function SavedPlacesSection({ places, onQuickRecord }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    label: "",
    venue_name: "",
    address: "",
    team_name: "",
    sport_type: "" as "" | JourneySport,
    default_hours: "2",
    default_minutes: "0",
  });

  const resetForm = () => {
    setForm({
      label: "",
      venue_name: "",
      address: "",
      team_name: "",
      sport_type: "",
      default_hours: "2",
      default_minutes: "0",
    });
    setEditingId(null);
    setShowAdd(false);
    setError(null);
  };

  const startEdit = (place: PlaySavedPlace) => {
    const total = place.default_duration_minutes ?? 120;
    setForm({
      label: place.label,
      venue_name: place.venue_name,
      address: place.address,
      team_name: place.team_name,
      sport_type: place.sport_type ?? "",
      default_hours: String(Math.floor(total / 60)),
      default_minutes: String(total % 60),
    });
    setEditingId(place.id);
    setShowAdd(true);
    setError(null);
  };

  const saveForm = () => {
    if (!form.venue_name.trim()) {
      setError("請填寫地點名稱");
      return;
    }
    const h = Number(form.default_hours) || 0;
    const m = Number(form.default_minutes) || 0;
    const duration = h * 60 + m;

    startTransition(async () => {
      try {
        const payload = {
          label: form.label.trim() || form.venue_name.trim(),
          venue_name: form.venue_name.trim(),
          address: form.address.trim(),
          team_name: form.team_name.trim(),
          sport_type: form.sport_type || null,
          default_duration_minutes: duration > 0 ? duration : null,
        };

        if (editingId) {
          await updateSavedPlace(editingId, payload);
        } else {
          await createSavedPlace(payload);
        }
        resetForm();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "儲存失敗");
      }
    });
  };

  const remove = (id: string) => {
    if (!window.confirm("確定刪除此常用捷徑？")) return;
    startTransition(async () => {
      await deleteSavedPlace(id);
      router.refresh();
    });
  };

  return (
    <section className="glass-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
            <Star className="h-4 w-4 text-accent" />
            常去捷徑
          </h2>
          <p className="text-xs text-muted">
            一鍵帶入地點、球隊與預設時長，不用每次重打
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            resetForm();
            setShowAdd(true);
          }}
        >
          新增捷徑
        </Button>
      </div>

      {places.length === 0 && !showAdd ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          還沒有常用捷徑。紀錄打球時可勾選「記住」，或按「新增捷徑」手動建立。
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <article key={place.id} className="play-saved-card">
              <button
                type="button"
                className="play-saved-card__main"
                onClick={() => onQuickRecord?.(place)}
                disabled={!onQuickRecord}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{place.label}</p>
                  {place.sport_type && (
                    <span
                      className={cn(
                        "tag shrink-0 text-[10px]",
                        place.sport_type === "pickleball"
                          ? "bg-primary-subtle text-primary"
                          : "bg-violet-100 text-violet-700",
                      )}
                    >
                      {JOURNEY_SPORT_LABELS[place.sport_type]}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted line-clamp-1">
                  {place.venue_name}
                  {place.team_name ? ` · ${place.team_name}` : ""}
                </p>
                {place.default_duration_minutes && (
                  <p className="mt-1 font-data text-xs text-primary">
                    預設 {Math.floor(place.default_duration_minutes / 60)}h
                    {place.default_duration_minutes % 60
                      ? ` ${place.default_duration_minutes % 60}m`
                      : ""}
                  </p>
                )}
              </button>
              <div className="play-saved-card__actions">
                <button
                  type="button"
                  className="rounded p-1 text-muted hover:text-foreground"
                  onClick={() => startEdit(place)}
                  aria-label="編輯"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-muted hover:text-live"
                  onClick={() => remove(place.id)}
                  disabled={pending}
                  aria-label="刪除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="mt-4 rounded-xl border border-primary-soft/60 bg-primary-subtle/20 p-4">
          <h3 className="text-sm font-semibold text-foreground">
            {editingId ? "編輯捷徑" : "新增常用捷徑"}
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-muted">捷徑名稱</span>
              <Input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="例：鳳山羽球 · 星鑽"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">地點名稱</span>
              <Input
                value={form.venue_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, venue_name: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">球隊</span>
              <Input
                value={form.team_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, team_name: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-muted">地址（選填，有座標可略）</span>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
            </label>
            <div className="sm:col-span-2">
              <span className="mb-1 block text-sm text-muted">預設運動</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={cn(
                    "rounded-[8px] border px-3 py-1.5 text-xs font-medium",
                    !form.sport_type
                      ? "border-primary bg-primary-subtle text-primary"
                      : "border-border text-muted",
                  )}
                  onClick={() => setForm((f) => ({ ...f, sport_type: "" }))}
                >
                  不限
                </button>
                {SPORTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={cn(
                      "rounded-[8px] border px-3 py-1.5 text-xs font-medium",
                      form.sport_type === s
                        ? s === "pickleball"
                          ? "border-primary bg-primary-subtle text-primary"
                          : "border-violet-300 bg-violet-50 text-violet-700"
                        : "border-border text-muted",
                    )}
                    onClick={() => setForm((f) => ({ ...f, sport_type: s }))}
                  >
                    {JOURNEY_SPORT_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">預設小時</span>
              <Input
                type="number"
                min={0}
                max={12}
                value={form.default_hours}
                onChange={(e) =>
                  setForm((f) => ({ ...f, default_hours: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">預設分鐘</span>
              <Input
                type="number"
                min={0}
                max={59}
                value={form.default_minutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, default_minutes: e.target.value }))
                }
              />
            </label>
          </div>
          {error && <p className="mt-2 text-sm text-live">{error}</p>}
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={saveForm} loading={pending}>
              儲存
            </Button>
            <Button size="sm" variant="secondary" onClick={resetForm}>
              取消
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
