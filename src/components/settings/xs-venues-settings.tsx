"use client";

import { useState, useTransition } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import {
  createXsVenue,
  deleteXsVenue,
  updateXsVenue,
} from "@/lib/actions/xs/venues";
import type { XsVenue } from "@/types/xs";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  initialVenues: XsVenue[];
  className?: string;
};

type EditDraft = {
  name: string;
  slug: string;
  courtCount: string;
};

export function XsVenuesSettings({ initialVenues, className }: Props) {
  const [venues, setVenues] = useState(initialVenues);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [courtCount, setCourtCount] = useState("4");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [isPending, startTransition] = useTransition();
  const { success, error: toastError, confirm } = useAppUi();

  const handleCreate = () => {
    if (!name.trim()) {
      toastError("請輸入場地名稱");
      return;
    }
    startTransition(async () => {
      try {
        const venue = await createXsVenue({
          name,
          slug: slug.trim() || undefined,
          court_count: Number(courtCount) || 4,
        });
        setVenues((prev) =>
          [...prev, venue].sort((a, b) => a.sort_order - b.sort_order),
        );
        setName("");
        setSlug("");
        setCourtCount("4");
        success(`已新增場地「${venue.name}」`);
      } catch (e) {
        toastError(e instanceof Error ? e.message : "新增失敗");
      }
    });
  };

  const startEdit = (venue: XsVenue) => {
    setEditingId(venue.id);
    setEditDraft({
      name: venue.name,
      slug: venue.slug,
      courtCount: String(venue.court_count),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = (venueId: string) => {
    if (!editDraft?.name.trim()) {
      toastError("請輸入場地名稱");
      return;
    }
    startTransition(async () => {
      try {
        await updateXsVenue(venueId, {
          name: editDraft.name,
          slug: editDraft.slug.trim() || undefined,
          court_count: Number(editDraft.courtCount) || 1,
        });
        setVenues((prev) =>
          prev
            .map((v) =>
              v.id === venueId
                ? {
                    ...v,
                    name: editDraft.name.trim(),
                    slug: editDraft.slug.trim().toLowerCase() || v.slug,
                    court_count: Number(editDraft.courtCount) || v.court_count,
                  }
                : v,
            )
            .sort((a, b) => a.sort_order - b.sort_order),
        );
        cancelEdit();
        success("場地已更新");
      } catch (e) {
        toastError(e instanceof Error ? e.message : "更新失敗");
      }
    });
  };

  const toggleActive = (venue: XsVenue) => {
    startTransition(async () => {
      try {
        await updateXsVenue(venue.id, { active: !venue.active });
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

  const handleDelete = async (venue: XsVenue) => {
    const ok = await confirm({
      title: `刪除「${venue.name}」？`,
      description: "若已有對戰紀錄將無法刪除，請改為停用。",
      confirmLabel: "刪除",
      variant: "danger",
    });
    if (!ok) return;

    startTransition(async () => {
      try {
        await deleteXsVenue(venue.id);
        setVenues((prev) => prev.filter((v) => v.id !== venue.id));
        if (editingId === venue.id) cancelEdit();
        success(`已刪除場地「${venue.name}」`);
      } catch (e) {
        toastError(e instanceof Error ? e.message : "刪除失敗");
      }
    });
  };

  return (
    <Card className={cn("w-full max-w-lg", className)}>
      <CardTitle className="mb-2 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        星鑽活動場地
      </CardTitle>
      <p className="mb-4 text-sm text-muted">
        「今日對戰」頁會以分頁顯示各地點，預設為羽懿球場。
      </p>

      <ul className="mb-4 space-y-2">
        {venues.map((venue) => (
          <li
            key={venue.id}
            className={cn(
              "rounded-xl border px-3 py-2.5",
              venue.active
                ? "border-border bg-surface"
                : "border-border/60 bg-surface-muted/50 opacity-80",
            )}
          >
            {editingId === venue.id && editDraft ? (
              <div className="space-y-2">
                <Input
                  value={editDraft.name}
                  onChange={(e) =>
                    setEditDraft({ ...editDraft, name: e.target.value })
                  }
                  placeholder="場地名稱"
                  className="h-10"
                />
                <Input
                  value={editDraft.slug}
                  onChange={(e) =>
                    setEditDraft({ ...editDraft, slug: e.target.value })
                  }
                  placeholder="代碼 slug"
                  className="h-10"
                />
                <Input
                  type="number"
                  min={1}
                  value={editDraft.courtCount}
                  onChange={(e) =>
                    setEditDraft({ ...editDraft, courtCount: e.target.value })
                  }
                  placeholder="球場數"
                  className="h-10"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    loading={isPending}
                    onClick={() => saveEdit(venue.id)}
                    className="flex-1"
                  >
                    儲存
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={cancelEdit}
                    disabled={isPending}
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{venue.name}</p>
                  <p className="text-xs text-muted">
                    {venue.slug} · {venue.court_count} 面球場
                    {!venue.active && " · 已停用"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="btn-touch h-8 px-2"
                    disabled={isPending}
                    onClick={() => startEdit(venue)}
                    aria-label={`編輯 ${venue.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant={venue.active ? "secondary" : "default"}
                    className="btn-touch h-8 px-2 text-xs"
                    disabled={isPending}
                    onClick={() => toggleActive(venue)}
                  >
                    {venue.active ? "停用" : "啟用"}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="btn-touch h-8 px-2"
                    disabled={isPending || venues.length <= 1}
                    onClick={() => void handleDelete(venue)}
                    aria-label={`刪除 ${venue.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
        <p className="text-sm font-semibold">新增場地</p>
        <Input
          placeholder="場地名稱"
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
