"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search, Trash2, UserPlus } from "lucide-react";
import {
  createKhpaPlayer,
  deleteKhpaPlayer,
  updateKhpaPlayer,
} from "@/lib/actions/khpa/players";
import { KhpaBadgeAvatar, KhpaBadgePill } from "@/components/khpa/badge-avatar";
import { KhpaPagination } from "@/components/khpa/khpa-pagination";
import { useAppUi } from "@/components/providers/app-ui-provider";
import type { KhpaLeaderboardEntry, KhpaPlayer } from "@/types/khpa";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

type Props = {
  players: KhpaPlayer[];
  leaderboard: KhpaLeaderboardEntry[];
  canDelete: boolean;
};

export function KhpaPlayersManager({ players, leaderboard, canDelete }: Props) {
  const [list, setList] = useState(players);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(list.length === 0);
  const [name, setName] = useState("");
  const [duprId, setDuprId] = useState("");
  const [active, setActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { success, error: toastError, confirm } = useAppUi();

  const winsMap = Object.fromEntries(
    leaderboard.map((e) => [e.playerId, e.wins]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.display_name.toLowerCase().includes(q) ||
        p.dupr_id.toLowerCase().includes(q),
    );
  }, [list, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleCreate = () => {
    if (!duprId.trim()) {
      toastError("請輸入 DUPR ID");
      return;
    }
    startTransition(async () => {
      try {
        const player = await createKhpaPlayer({
          display_name: name,
          dupr_id: duprId,
          active,
        });
        setList((prev) =>
          [...prev, player].sort((a, b) => {
            if (a.active !== b.active) return a.active ? -1 : 1;
            return a.display_name.localeCompare(b.display_name, "zh-Hant");
          }),
        );
        setName("");
        setDuprId("");
        setActive(true);
        setShowAdd(false);
        setPage(1);
        success("已新增球員");
      } catch (e) {
        toastError(e instanceof Error ? e.message : "新增失敗");
      }
    });
  };

  const handleUpdate = (
    id: string,
    displayName: string,
    dupr: string,
    isActive: boolean,
  ) => {
    startTransition(async () => {
      try {
        await updateKhpaPlayer(id, {
          display_name: displayName,
          dupr_id: dupr,
          active: isActive,
        });
        setList((prev) =>
          prev
            .map((p) =>
              p.id === id
                ? { ...p, display_name: displayName, dupr_id: dupr, active: isActive }
                : p,
            )
            .sort((a, b) => {
              if (a.active !== b.active) return a.active ? -1 : 1;
              return a.display_name.localeCompare(b.display_name, "zh-Hant");
            }),
        );
        setEditingId(null);
        success("已更新球員");
      } catch (e) {
        toastError(e instanceof Error ? e.message : "更新失敗");
      }
    });
  };

  const handleDelete = async (id: string, playerName: string) => {
    const ok = await confirm({
      title: `刪除「${playerName}」？`,
      description: "僅系統管理員可刪除球員，此操作無法復原。",
      confirmLabel: "刪除",
      variant: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await deleteKhpaPlayer(id);
        setList((prev) => prev.filter((p) => p.id !== id));
        success("已刪除球員");
      } catch (e) {
        toastError(e instanceof Error ? e.message : "刪除失敗");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">球員名單</h2>
          <p className="text-sm text-muted">
            共 {list.length} 人 · DUPR ID 必填 · 停用者不會出現在對戰選單
          </p>
        </div>
        <Button
          className="btn-touch h-11 shrink-0"
          onClick={() => setShowAdd((v) => !v)}
        >
          <UserPlus className="h-4 w-4" />
          新增
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="搜尋姓名或 DUPR ID"
          className="h-12 pl-10 text-base"
        />
      </div>

      {showAdd && (
        <Card className="p-4">
          <CardTitle className="mb-3 text-base">新增球員</CardTitle>
          <div className="space-y-3">
            <Input
              placeholder="姓名（必填）"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base"
              autoFocus
            />
            <Input
              placeholder="DUPR ID（必填）"
              value={duprId}
              onChange={(e) => setDuprId(e.target.value)}
              className="h-11"
              required
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              啟用（可參加對戰）
            </label>
            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                loading={isPending}
                disabled={!name.trim() || !duprId.trim()}
                className="btn-touch h-11 flex-1"
              >
                <Plus className="h-4 w-4" />
                確認新增
              </Button>
              {list.length > 0 && (
                <Button
                  variant="secondary"
                  className="h-11"
                  onClick={() => setShowAdd(false)}
                >
                  取消
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {list.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted">還沒有球員，請先新增（需填 DUPR ID）</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted">找不到符合「{query}」的球員</p>
        </Card>
      ) : (
        <>
          <ul className="space-y-2">
            {pageItems.map((player) => (
              <li
                key={player.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-3 py-3 shadow-sm",
                  player.active
                    ? "border-border bg-surface"
                    : "border-border/60 bg-surface-muted/50 opacity-75",
                )}
              >
                <KhpaBadgeAvatar
                  wins={winsMap[player.id] ?? 0}
                  name={player.display_name}
                  size="md"
                />
                {editingId === player.id ? (
                  <EditRow
                    player={player}
                    loading={isPending}
                    onSave={(n, d, a) => handleUpdate(player.id, n, d, a)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{player.display_name}</p>
                        <KhpaBadgePill wins={winsMap[player.id] ?? 0} />
                        {!player.active && (
                          <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[10px] text-muted">
                            停用
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted">
                        DUPR {player.dupr_id} · 今年 {winsMap[player.id] ?? 0} 勝
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="btn-touch"
                        onClick={() => setEditingId(player.id)}
                      >
                        編輯
                      </Button>
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="danger"
                          className="btn-touch"
                          onClick={() => void handleDelete(player.id, player.display_name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>

          <KhpaPagination
            page={safePage}
            pageSize={PAGE_SIZE}
            totalItems={filtered.length}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function EditRow({
  player,
  loading,
  onSave,
  onCancel,
}: {
  player: KhpaPlayer;
  loading: boolean;
  onSave: (name: string, duprId: string, active: boolean) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(player.display_name);
  const [duprId, setDuprId] = useState(player.dupr_id);
  const [active, setActive] = useState(player.active);

  return (
    <div className="flex flex-1 flex-col gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
      <Input
        value={duprId}
        onChange={(e) => setDuprId(e.target.value)}
        placeholder="DUPR ID（必填）"
        className="h-10"
        required
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        啟用
      </label>
      <div className="flex gap-1">
        <Button
          size="sm"
          loading={loading}
          onClick={() => onSave(name, duprId, active)}
          disabled={!name.trim() || !duprId.trim()}
        >
          儲存
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  );
}
