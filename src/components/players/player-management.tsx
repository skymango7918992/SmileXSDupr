"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Check,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import {
  createPlayer,
  deletePlayer,
  updatePlayer,
} from "@/lib/actions/players";
import type { Player } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 10;

type Props = {
  initialPlayers: Player[];
};

type RowDraft = {
  name: string;
  dupr_id: string;
  rating: string;
};

type PlayerRowProps = {
  player: Player;
  isEditing: boolean;
  rowDraft: RowDraft | null;
  isPending: boolean;
  editingLocked: boolean;
  onDraftChange: (draft: RowDraft) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
};

function PlayerRowActions({
  isEditing,
  isPending,
  editingLocked,
  playerActive,
  onStartEdit,
  onSave,
  onCancel,
  onToggleActive,
  onDelete,
  layout = "row",
}: {
  isEditing: boolean;
  isPending: boolean;
  editingLocked: boolean;
  playerActive: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  layout?: "row" | "grid";
}) {
  const btnClass = layout === "grid" ? "min-h-11 flex-1" : "";

  if (isEditing) {
    return (
      <div className={cn("flex gap-2", layout === "grid" && "w-full")}>
        <Button
          size={layout === "grid" ? "lg" : "sm"}
          disabled={isPending}
          onClick={onSave}
          className={btnClass}
        >
          <Check className="h-4 w-4" />
          儲存
        </Button>
        <Button
          size={layout === "grid" ? "lg" : "sm"}
          variant="secondary"
          disabled={isPending}
          onClick={onCancel}
          className={btnClass}
        >
          <X className="h-4 w-4" />
          取消
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", layout === "grid" && "w-full")}>
      <Button
        size={layout === "grid" ? "lg" : "sm"}
        variant="secondary"
        disabled={isPending || editingLocked}
        onClick={onStartEdit}
        className={btnClass}
        aria-label="編輯"
      >
        <Pencil className="h-4 w-4" />
        {layout === "grid" && "編輯"}
      </Button>
      <Button
        size={layout === "grid" ? "lg" : "sm"}
        variant="secondary"
        disabled={isPending || editingLocked}
        onClick={onToggleActive}
        className={layout === "grid" ? "min-h-11 px-3" : ""}
        aria-label={playerActive ? "停用" : "啟用"}
      >
        {playerActive ? (
          <UserX className="h-4 w-4" />
        ) : (
          <UserCheck className="h-4 w-4" />
        )}
      </Button>
      <Button
        size={layout === "grid" ? "lg" : "sm"}
        variant="danger"
        disabled={isPending || editingLocked}
        onClick={onDelete}
        className={layout === "grid" ? "min-h-11 px-3" : ""}
        aria-label="刪除"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function PlayerCard({
  player,
  isEditing,
  rowDraft,
  isPending,
  editingLocked,
  onDraftChange,
  onStartEdit,
  onSave,
  onCancel,
  onToggleActive,
  onDelete,
}: PlayerRowProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
        isEditing && "border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200",
      )}
    >
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              姓名
            </label>
            <Input
              value={rowDraft?.name ?? ""}
              onChange={(e) =>
                onDraftChange({
                  name: e.target.value,
                  dupr_id: rowDraft?.dupr_id ?? "",
                  rating: rowDraft?.rating ?? "",
                })
              }
              className="min-h-11 text-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              DUPR ID
            </label>
            <Input
              value={rowDraft?.dupr_id ?? ""}
              onChange={(e) =>
                onDraftChange({
                  name: rowDraft?.name ?? "",
                  dupr_id: e.target.value.toUpperCase(),
                  rating: rowDraft?.rating ?? "",
                })
              }
              className="min-h-11 font-mono text-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              DUPR 評分
            </label>
            <Input
              type="number"
              step="0.01"
              value={rowDraft?.rating ?? ""}
              onChange={(e) =>
                onDraftChange({
                  name: rowDraft?.name ?? "",
                  dupr_id: rowDraft?.dupr_id ?? "",
                  rating: e.target.value,
                })
              }
              className="min-h-11 text-base"
              placeholder="選填"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-slate-900">
              {player.name}
            </p>
            <p className="mt-0.5 font-mono text-sm text-slate-600">
              {player.dupr_id}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={
                  player.active
                    ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
                    : "rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500"
                }
              >
                {player.active ? "有效" : "停用"}
              </span>
              {player.dupr_rating != null && (
                <span className="text-xs text-slate-500">
                  評分 {player.dupr_rating}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <PlayerRowActions
          isEditing={isEditing}
          isPending={isPending}
          editingLocked={editingLocked}
          playerActive={player.active}
          onStartEdit={onStartEdit}
          onSave={onSave}
          onCancel={onCancel}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
          layout="grid"
        />
      </div>
    </div>
  );
}

function PlayerTableRow({
  player,
  isEditing,
  rowDraft,
  isPending,
  editingLocked,
  onDraftChange,
  onStartEdit,
  onSave,
  onCancel,
  onToggleActive,
  onDelete,
}: PlayerRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-slate-50 transition-colors",
        isEditing && "bg-emerald-50/80",
      )}
    >
      <td className="px-3 py-2">
        {isEditing ? (
          <Input
            value={rowDraft?.name ?? ""}
            onChange={(e) =>
              onDraftChange({
                name: e.target.value,
                dupr_id: rowDraft?.dupr_id ?? "",
                rating: rowDraft?.rating ?? "",
              })
            }
            className="h-9"
          />
        ) : (
          <span className="text-sm font-medium text-slate-900">{player.name}</span>
        )}
      </td>
      <td className="px-3 py-2">
        {isEditing ? (
          <Input
            value={rowDraft?.dupr_id ?? ""}
            onChange={(e) =>
              onDraftChange({
                name: rowDraft?.name ?? "",
                dupr_id: e.target.value.toUpperCase(),
                rating: rowDraft?.rating ?? "",
              })
            }
            className="h-9 font-mono text-sm"
          />
        ) : (
          <span className="font-mono text-sm text-slate-600">{player.dupr_id}</span>
        )}
      </td>
      <td className="px-3 py-2">
        {isEditing ? (
          <Input
            type="number"
            step="0.01"
            value={rowDraft?.rating ?? ""}
            onChange={(e) =>
              onDraftChange({
                name: rowDraft?.name ?? "",
                dupr_id: rowDraft?.dupr_id ?? "",
                rating: e.target.value,
              })
            }
            className="h-9 w-24"
            placeholder="—"
          />
        ) : (
          <span className="text-sm text-slate-600">
            {player.dupr_rating ?? "—"}
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        <span
          className={
            player.active
              ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
              : "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
          }
        >
          {player.active ? "有效" : "停用"}
        </span>
      </td>
      <td className="px-3 py-2">
        <PlayerRowActions
          isEditing={isEditing}
          isPending={isPending}
          editingLocked={editingLocked}
          playerActive={player.active}
          onStartEdit={onStartEdit}
          onSave={onSave}
          onCancel={onCancel}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}

export function PlayerManagement({ initialPlayers }: Props) {
  const [players, setPlayers] = useState(initialPlayers);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [newName, setNewName] = useState("");
  const [newDuprId, setNewDuprId] = useState("");
  const [newRating, setNewRating] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rowDraft, setRowDraft] = useState<RowDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.dupr_id.toLowerCase().includes(q),
    );
  }, [players, search]);

  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / PAGE_SIZE));

  const paginatedPlayers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPlayers.slice(start, start + PAGE_SIZE);
  }, [filteredPlayers, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const refreshFromServer = async () => {
    const { getPlayers } = await import("@/lib/actions/players");
    const data = await getPlayers();
    setPlayers(data);
  };

  const handleCreate = () => {
    if (!newName.trim() || !newDuprId.trim()) {
      setError("請填寫姓名與 DUPR ID");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await createPlayer({
          name: newName,
          dupr_id: newDuprId,
          dupr_rating: newRating ? Number(newRating) : null,
        });
        setNewName("");
        setNewDuprId("");
        setNewRating("");
        await refreshFromServer();
      } catch (e) {
        setError(e instanceof Error ? e.message : "新增失敗");
      }
    });
  };

  const startRowEdit = (player: Player) => {
    setEditingId(player.id);
    setRowDraft({
      name: player.name,
      dupr_id: player.dupr_id,
      rating: player.dupr_rating?.toString() ?? "",
    });
    setError(null);
  };

  const cancelRowEdit = () => {
    setEditingId(null);
    setRowDraft(null);
  };

  const saveRowEdit = (playerId: string) => {
    if (!rowDraft?.name.trim() || !rowDraft.dupr_id.trim()) {
      setError("請填寫姓名與 DUPR ID");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await updatePlayer(playerId, {
          name: rowDraft.name,
          dupr_id: rowDraft.dupr_id,
          dupr_rating: rowDraft.rating ? Number(rowDraft.rating) : null,
        });
        cancelRowEdit();
        await refreshFromServer();
      } catch (e) {
        setError(e instanceof Error ? e.message : "儲存失敗");
      }
    });
  };

  const toggleActive = (player: Player) => {
    startTransition(async () => {
      try {
        await updatePlayer(player.id, { active: !player.active });
        await refreshFromServer();
      } catch (e) {
        setError(e instanceof Error ? e.message : "更新失敗");
      }
    });
  };

  const handleDelete = (player: Player) => {
    if (!confirm(`確定刪除球員「${player.name}」？`)) return;
    startTransition(async () => {
      try {
        if (editingId === player.id) cancelRowEdit();
        await deletePlayer(player.id);
        await refreshFromServer();
      } catch (e) {
        setError(e instanceof Error ? e.message : "刪除失敗");
      }
    });
  };

  const rowProps = (player: Player): PlayerRowProps => ({
    player,
    isEditing: editingId === player.id,
    rowDraft,
    isPending,
    editingLocked: editingId !== null && editingId !== player.id,
    onDraftChange: setRowDraft,
    onStartEdit: () => startRowEdit(player),
    onSave: () => saveRowEdit(player.id),
    onCancel: cancelRowEdit,
    onToggleActive: () => toggleActive(player),
    onDelete: () => handleDelete(player),
  });

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card className="p-4 sm:p-5">
        <CardTitle className="mb-4">新增球員</CardTitle>
        <div className="grid gap-3">
          <Input
            placeholder="姓名"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="min-h-11 text-base"
          />
          <Input
            placeholder="DUPR ID"
            value={newDuprId}
            onChange={(e) => setNewDuprId(e.target.value.toUpperCase())}
            className="min-h-11 text-base"
          />
          <Input
            placeholder="DUPR 評分（選填）"
            type="number"
            step="0.01"
            value={newRating}
            onChange={(e) => setNewRating(e.target.value)}
            className="min-h-11 text-base"
          />
        </div>
        <div className="mt-4">
          <Button
            onClick={handleCreate}
            disabled={isPending}
            className="min-h-11 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            新增球員
          </Button>
        </div>
        {error && !editingId && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 space-y-3">
          <CardTitle>球員列表</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜尋姓名或 DUPR ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-11 pl-9 text-base"
            />
          </div>
          <p className="text-xs text-slate-500">
            共 {players.length} 位球員
            {search.trim() && ` · 搜尋結果 ${filteredPlayers.length} 位`}
            {filteredPlayers.length > 0 && ` · 每頁 ${PAGE_SIZE} 位`}
          </p>
        </div>

        {/* 手機：卡片列表 */}
        <div className="space-y-3 md:hidden">
          {paginatedPlayers.map((player) => (
            <PlayerCard key={player.id} {...rowProps(player)} />
          ))}
        </div>

        {/* 桌面：表格 */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-3 py-2 font-medium">姓名</th>
                <th className="px-3 py-2 font-medium">DUPR ID</th>
                <th className="px-3 py-2 font-medium">評分</th>
                <th className="px-3 py-2 font-medium">狀態</th>
                <th className="px-3 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPlayers.map((player) => (
                <PlayerTableRow key={player.id} {...rowProps(player)} />
              ))}
            </tbody>
          </table>
        </div>

        {players.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">尚無球員資料</p>
        )}
        {players.length > 0 && filteredPlayers.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            找不到符合「{search}」的球員
          </p>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredPlayers.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          className="mt-4"
        />

        {error && editingId && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </Card>
    </div>
  );
}
