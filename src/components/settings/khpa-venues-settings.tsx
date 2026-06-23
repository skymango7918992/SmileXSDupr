"use client";

import { useState, useTransition } from "react";
import { MapPin, Plus } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import {
  createKhpaVenue,
  updateKhpaVenue,
} from "@/lib/actions/khpa/venues";
import type { KhpaVenue } from "@/types/khpa";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  initialVenues: KhpaVenue[];
};

export function KhpaVenuesSettings({ initialVenues }: Props) {
  const [venues, setVenues] = useState(initialVenues);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [courtCount, setCourtCount] = useState("3");
  const [isPending, startTransition] = useTransition();
  const { success, error: toastError } = useAppUi();

  const handleCreate = () => {
    if (!name.trim()) {
      toastError("請輸入場地名稱");
      return;
    }
    startTransition(async () => {
      try {
        const venue = await createKhpaVenue({
          name,
          slug: slug.trim() || undefined,
          court_count: Number(courtCount) || 3,
        });
        setVenues((prev) => [...prev, venue].sort((a, b) => a.sort_order - b.sort_order));
        setName("");
        setSlug("");
        setCourtCount("3");
        success(`已新增場地「${venue.name}」`);
      } catch (e) {
        toastError(e instanceof Error ? e.message : "新增失敗");
      }
    });
  };

  const toggleActive = (venue: KhpaVenue) => {
    startTransition(async () => {
      try {
        await updateKhpaVenue(venue.id, { active: !venue.active });
        setVenues((prev) =>
          prev.map((v) =>
            v.id === venue.id ? { ...v, active: !v.active } : v,
          ),
        );
        success(venue.active ? `已停用「${venue.name}」` : `已啟用「${venue.name}」`);
      } catch (e) {
        toastError(e instanceof Error ? e.message : "更新失敗");
      }
    });
  };

  return (
    <Card className="max-w-lg">
      <CardTitle className="mb-2 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-teal-600" />
        協會活動場地
      </CardTitle>
      <p className="mb-4 text-sm text-muted">
        協會「今日對戰」頁會以分頁顯示各地點，同一天可在不同場地各自輸入成績。
      </p>

      <ul className="mb-4 space-y-2">
        {venues.map((venue) => (
          <li
            key={venue.id}
            className={cn(
              "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5",
              venue.active
                ? "border-border bg-surface"
                : "border-border/60 bg-surface-muted/50 opacity-70",
            )}
          >
            <div className="min-w-0">
              <p className="font-medium">{venue.name}</p>
              <p className="text-xs text-muted">
                {venue.slug} · {venue.court_count} 面球場
                {!venue.active && " · 已停用"}
              </p>
            </div>
            <Button
              size="sm"
              variant={venue.active ? "secondary" : "default"}
              className="btn-touch shrink-0"
              disabled={isPending}
              onClick={() => toggleActive(venue)}
            >
              {venue.active ? "停用" : "啟用"}
            </Button>
          </li>
        ))}
      </ul>

      <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
        <p className="text-sm font-semibold">新增場地</p>
        <Input
          placeholder="場地名稱（例：河堤公園）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11"
        />
        <Input
          placeholder="代碼 slug（選填，英文）"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="h-11"
        />
        <Input
          type="number"
          min={1}
          placeholder="球場數"
          value={courtCount}
          onChange={(e) => setCourtCount(e.target.value)}
          className="h-11"
        />
        <Button
          onClick={handleCreate}
          loading={isPending}
          disabled={!name.trim()}
          className="w-full"
        >
          <Plus className="h-4 w-4" />
          新增場地
        </Button>
      </div>
    </Card>
  );
}
