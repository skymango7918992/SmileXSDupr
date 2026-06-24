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
import { getDuprEnvStatusAction } from "@/lib/actions/dupr-config";
import { syncDuprClubMembers } from "@/lib/actions/dupr-sync";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { playerDisplayName } from "@/lib/player-display";
import type { Player, PlayerSource } from "@/types/database";
import type { DuprConfigMode, DuprEnvStatus } from "@/types/dupr";
import { cn } from "@/lib/utils";
import { CuteAvatar } from "@/components/brand/cute-avatar";
import { PageHero } from "@/components/brand/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 10;

type Props = {
  initialPlayers: Player[];
  readOnly?: boolean;
};

function SourceBadge({ source }: { source: PlayerSource }) {
  return (
    <span
      className={cn(
        "tag text-[10px]",
        source === "club" ? "tag-primary" : "tag-neutral",
      )}
    >
      {source === "club" ? "Club" : "手動"}
    </span>
  );
}

type RowDraft = {
  name: string;
  displayName: string;
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
  readOnly?: boolean;
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
  readOnly = false,
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
  readOnly?: boolean;
}) {
  const btnClass = layout === "grid" ? "min-h-11 flex-1" : "";

  if (readOnly) return null;

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
  readOnly,
}: PlayerRowProps) {
  const isClub = player.source === "club";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 shadow-sm",
        isEditing && "border-primary/30 bg-primary/8 ring-1 ring-primary/15",
      )}
    >
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              DUPR 名稱
            </label>
            {isClub ? (
              <p className="min-h-11 rounded-md border border-border bg-surface-muted/40 px-3 py-2.5 text-base text-foreground">
                {rowDraft?.name}
              </p>
            ) : (
              <Input
                value={rowDraft?.name ?? ""}
                onChange={(e) =>
                  onDraftChange({
                    name: e.target.value,
                    displayName: rowDraft?.displayName ?? "",
                    dupr_id: rowDraft?.dupr_id ?? "",
                    rating: rowDraft?.rating ?? "",
                  })
                }
                className="min-h-11 text-base"
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              顯示名稱
            </label>
            <Input
              value={rowDraft?.displayName ?? ""}
              onChange={(e) =>
                onDraftChange({
                  name: rowDraft?.name ?? "",
                  displayName: e.target.value,
                  dupr_id: rowDraft?.dupr_id ?? "",
                  rating: rowDraft?.rating ?? "",
                })
              }
              className="min-h-11 text-base"
              placeholder="對戰中心顯示用，可填中文"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              DUPR ID
            </label>
            {isClub ? (
              <p className="min-h-11 rounded-md border border-border bg-surface-muted/40 px-3 py-2.5 font-mono text-base text-foreground">
                {rowDraft?.dupr_id}
              </p>
            ) : (
              <Input
                value={rowDraft?.dupr_id ?? ""}
                onChange={(e) =>
                  onDraftChange({
                    name: rowDraft?.name ?? "",
                    displayName: rowDraft?.displayName ?? "",
                    dupr_id: e.target.value.toUpperCase(),
                    rating: rowDraft?.rating ?? "",
                  })
                }
                className="min-h-11 font-mono text-base"
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              DUPR 評分
            </label>
            {isClub ? (
              <p className="min-h-11 rounded-md border border-border bg-surface-muted/40 px-3 py-2.5 text-base text-foreground">
                {rowDraft?.rating || "NR"}
              </p>
            ) : (
              <Input
                type="number"
                step="0.01"
                value={rowDraft?.rating ?? ""}
                onChange={(e) =>
                  onDraftChange({
                    name: rowDraft?.name ?? "",
                    displayName: rowDraft?.displayName ?? "",
                    dupr_id: rowDraft?.dupr_id ?? "",
                    rating: e.target.value,
                  })
                }
                className="min-h-11 text-base"
                placeholder="選填"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 gap-3">
            <CuteAvatar name={playerDisplayName(player)} variant="chibi" size="md" />
            <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-foreground">
              {playerDisplayName(player)}
            </p>
            {player.display_name?.trim() &&
              player.display_name.trim() !== player.name && (
                <p className="mt-0.5 truncate text-xs text-muted">
                  DUPR：{player.name}
                </p>
              )}
            <p className="mt-0.5 font-mono text-sm text-muted">
              {player.dupr_id}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={
                  player.active
                    ? "tag tag-success"
                    : "tag tag-neutral"
                }
              >
                {player.active ? "有效" : "停用"}
              </span>
              <SourceBadge source={player.source ?? "manual"} />
              {player.dupr_rating != null && (
                <span className="text-xs text-muted">
                  評分 {player.dupr_rating}
                </span>
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      {!readOnly && (
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
          readOnly={readOnly}
          layout="grid"
        />
      </div>
      )}
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
  readOnly,
}: PlayerRowProps) {
  const isClub = player.source === "club";

  return (
    <tr
      className={cn(
        "border-b border-border/60 transition-colors",
        isEditing && "bg-primary/8",
      )}
    >
      <td className="px-3 py-2">
        {isEditing ? (
          isClub ? (
            <span className="text-sm text-muted">{rowDraft?.name}</span>
          ) : (
            <Input
              value={rowDraft?.name ?? ""}
              onChange={(e) =>
                onDraftChange({
                  name: e.target.value,
                  displayName: rowDraft?.displayName ?? "",
                  dupr_id: rowDraft?.dupr_id ?? "",
                  rating: rowDraft?.rating ?? "",
                })
              }
              className="h-9"
            />
          )
        ) : (
          <span className="text-sm text-foreground">{player.name}</span>
        )}
      </td>
      <td className="px-3 py-2">
        {isEditing ? (
          <Input
            value={rowDraft?.displayName ?? ""}
            onChange={(e) =>
              onDraftChange({
                name: rowDraft?.name ?? "",
                displayName: e.target.value,
                dupr_id: rowDraft?.dupr_id ?? "",
                rating: rowDraft?.rating ?? "",
              })
            }
            className="h-9"
            placeholder="對戰中心顯示"
          />
        ) : (
          <div className="flex items-center gap-2">
            <CuteAvatar name={playerDisplayName(player)} variant="chibi" size="sm" />
            <span className="text-sm font-medium text-foreground">
              {playerDisplayName(player)}
            </span>
          </div>
        )}
      </td>
      <td className="px-3 py-2">
        {isEditing ? (
          isClub ? (
            <span className="font-mono text-sm text-muted">
              {rowDraft?.dupr_id}
            </span>
          ) : (
            <Input
              value={rowDraft?.dupr_id ?? ""}
              onChange={(e) =>
                onDraftChange({
                  name: rowDraft?.name ?? "",
                  displayName: rowDraft?.displayName ?? "",
                  dupr_id: e.target.value.toUpperCase(),
                  rating: rowDraft?.rating ?? "",
                })
              }
              className="h-9 font-mono text-sm"
            />
          )
        ) : (
          <span className="font-mono text-sm text-muted">{player.dupr_id}</span>
        )}
      </td>
      <td className="px-3 py-2">
        {isEditing ? (
          isClub ? (
            <span className="text-sm text-muted">
              {rowDraft?.rating || "NR"}
            </span>
          ) : (
            <Input
              type="number"
              step="0.01"
              value={rowDraft?.rating ?? ""}
              onChange={(e) =>
                onDraftChange({
                  name: rowDraft?.name ?? "",
                  displayName: rowDraft?.displayName ?? "",
                  dupr_id: rowDraft?.dupr_id ?? "",
                  rating: e.target.value,
                })
              }
              className="h-9 w-24"
              placeholder="—"
            />
          )
        ) : (
          <span className="text-sm text-muted">
            {player.dupr_rating ?? "NR"}
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={
              player.active
                ? "tag tag-success"
                : "tag tag-neutral"
            }
          >
            {player.active ? "有效" : "停用"}
          </span>
          <SourceBadge source={player.source ?? "manual"} />
        </div>
      </td>
      {!readOnly && (
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
          readOnly={readOnly}
        />
      </td>
      )}
    </tr>
  );
}

function DuprEnvDiagnostics({ status }: { status: DuprEnvStatus | null }) {
  if (!status || status.mode !== "none") return null;

  const missing: string[] = [];
  if (!status.hasToken) {
    if (!status.hasEmail) missing.push("DUPR_EMAIL");
    if (!status.hasPassword) missing.push("DUPR_PASSWORD");
    if (!status.hasEmail && !status.hasPassword) {
      missing.push("或 DUPR_API_TOKEN");
    }
  }

  return (
    <p className="mt-2 text-xs text-muted">
      伺服器未讀到：
      {missing.length > 0 ? missing.join("、") : "DUPR 相關變數"}
      。請在 Cloudflare → Workers → <strong>Variables and Secrets</strong>（執行期）
      設定，變數名稱須完全一致（是 DUPR 不是 DUPP），儲存後重新部署。
    </p>
  );
}

export function PlayerManagement({ initialPlayers, readOnly = false }: Props) {
  const [players, setPlayers] = useState(initialPlayers);
  const [duprConfigMode, setDuprConfigMode] = useState<DuprConfigMode | null>(
    null,
  );
  const [duprEnvStatus, setDuprEnvStatus] = useState<DuprEnvStatus | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [newName, setNewName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newDuprId, setNewDuprId] = useState("");
  const [newRating, setNewRating] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rowDraft, setRowDraft] = useState<RowDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { confirm, success: toastSuccess } = useAppUi();

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.display_name ?? "").toLowerCase().includes(q) ||
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

  useEffect(() => {
    void getDuprEnvStatusAction().then((status) => {
      setDuprEnvStatus(status);
      setDuprConfigMode(status.mode);
    });
  }, []);

  const refreshFromServer = async () => {
    const { getPlayers } = await import("@/lib/actions/players");
    const data = await getPlayers();
    setPlayers(data);
  };

  const handleDuprSync = () => {
    setError(null);
    setSyncMessage(null);
    startTransition(async () => {
      try {
        const result = await syncDuprClubMembers();
        setSyncMessage(
          `Club ${result.clubTotal} 人 · 新增 ${result.added} · 更新 ${result.updated} · 手動轉 Club ${result.converted}${result.merged ? ` · 合併重複 ${result.merged}` : ""} · 移除 ${result.removed}${result.deactivated ? ` · 停用 ${result.deactivated}` : ""}`,
        );
        await refreshFromServer();
      } catch (e) {
        setError(e instanceof Error ? e.message : "DUPR 同步失敗");
      }
    });
  };

  const handleCreate = () => {
    if (!newName.trim() || !newDuprId.trim()) {
      setError("請填寫 DUPR 名稱與 DUPR ID");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await createPlayer({
          name: newName,
          display_name: newDisplayName.trim() || newName,
          dupr_id: newDuprId,
          dupr_rating: newRating ? Number(newRating) : null,
        });
        setNewName("");
        setNewDisplayName("");
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
      displayName: player.display_name?.trim() || player.name,
      dupr_id: player.dupr_id,
      rating: player.dupr_rating?.toString() ?? "",
    });
    setError(null);
  };

  const cancelRowEdit = () => {
    setEditingId(null);
    setRowDraft(null);
  };

  const saveRowEdit = (player: Player) => {
    if (!rowDraft?.name.trim() || !rowDraft.dupr_id.trim()) {
      setError("請填寫 DUPR 名稱與 DUPR ID");
      return;
    }
    if (!rowDraft.displayName.trim()) {
      setError("請填寫顯示名稱");
      return;
    }

    const displayName = rowDraft.displayName.trim();
    const duprName = rowDraft.name.trim();
    const customized = displayName !== duprName;

    setError(null);
    startTransition(async () => {
      try {
        if (player.source === "club") {
          await updatePlayer(player.id, {
            display_name: displayName,
            display_name_customized: customized,
          });
        } else {
          await updatePlayer(player.id, {
            name: duprName,
            display_name: displayName,
            display_name_customized: customized,
            dupr_id: rowDraft.dupr_id,
            dupr_rating: rowDraft.rating ? Number(rowDraft.rating) : null,
          });
        }
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
    void (async () => {
      const ok = await confirm({
        title: `刪除「${playerDisplayName(player)}」？`,
        description:
          player.source === "manual"
            ? "若已有 Club 同名球員（含 O/0 打錯），將自動合併至 Club 資料。"
            : "刪除後無法復原。",
        confirmLabel: "刪除",
        variant: "danger",
      });
      if (!ok) return;

      setError(null);
      setSyncMessage(null);
      startTransition(async () => {
        try {
          if (editingId === player.id) cancelRowEdit();
          const result = await deletePlayer(player.id);
          if (result.action === "merged") {
            toastSuccess("已合併至 Club 並刪除重複球員");
          } else if (result.action === "deactivated") {
            toastSuccess("球員已停用（保留對戰紀錄）");
          } else {
            toastSuccess("球員已刪除");
          }
          await refreshFromServer();
        } catch (e) {
          setError(e instanceof Error ? e.message : "刪除失敗");
        }
      });
    })();
  };

  const rowProps = (player: Player): PlayerRowProps => ({
    player,
    isEditing: editingId === player.id,
    rowDraft,
    isPending,
    editingLocked: editingId !== null && editingId !== player.id,
    onDraftChange: setRowDraft,
    onStartEdit: () => startRowEdit(player),
    onSave: () => saveRowEdit(player),
    onCancel: cancelRowEdit,
    onToggleActive: () => toggleActive(player),
    onDelete: () => handleDelete(player),
    readOnly,
  });

  const clubCount = players.filter((p) => p.source === "club").length;
  const manualCount = players.filter((p) => (p.source ?? "manual") === "manual").length;

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHero variant="players" />

      {readOnly && (
        <div className="rounded-[10px] border border-border bg-surface-muted/50 px-4 py-3 text-sm text-muted">
          一般使用者模式：球員資料僅供查閱，無法新增、編輯或刪除。
        </div>
      )}

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle>DUPR Club 同步</CardTitle>
            <p className="mt-1 text-sm text-muted">
              Club {duprEnvStatus?.xsClubId ?? duprEnvStatus?.clubId ?? "—"} · 目前 Club {clubCount} 人 · 手動 {manualCount}{" "}
              人
            </p>
            {duprConfigMode === null ? (
              <p className="mt-2 text-xs text-muted">正在檢查 DUPR 連線設定…</p>
            ) : duprConfigMode === "none" ? (
              <div className="mt-3 rounded-[10px] border border-warning/25 bg-warning/10 px-3 py-3 text-sm text-foreground">
                <p className="font-semibold">尚未設定 DUPR 連線</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  請在 <strong>Cloudflare → Workers → Variables and Secrets</strong>{" "}
                  （執行期 Secrets）或本機{" "}
                  <code className="rounded bg-surface px-1">.env</code> 加入（擇一即可）：
                </p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-surface p-2 text-[11px] leading-relaxed text-foreground">
{`# 方式 A（建議）：DUPR 登入帳密
DUPR_EMAIL=你的DUPR信箱
DUPR_PASSWORD=你的DUPR密碼
DUPR_CLUB_ID=4668804565

# 方式 B：Bearer Token
DUPR_API_TOKEN=eyJ...`}
                </pre>
                <p className="mt-2 text-xs text-primary">
                  Cloudflare 新增或修改變數後，請重新部署才會生效。DUPR 密碼請用
                  Secrets，不要加密選項。
                </p>
                <DuprEnvDiagnostics status={duprEnvStatus} />
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted">
                已設定：
                {duprConfigMode === "credentials"
                  ? " DUPR 帳密登入"
                  : " API Token"}
                · Club {duprEnvStatus?.xsClubId ?? duprEnvStatus?.clubId ?? "—"} · 相同 DUPR
                ID（含 O/0 打錯）會合併為 Club
              </p>
            )}
          </div>
          {!readOnly && (
          <Button
            onClick={handleDuprSync}
            loading={isPending}
            disabled={
              duprConfigMode !== "token" && duprConfigMode !== "credentials"
            }
            className="min-h-12 w-full shrink-0 sm:w-auto"
          >
            更新 Club 名單
          </Button>
          )}
        </div>
        {syncMessage && (
          <p className="mt-3 rounded-[10px] border border-info/25 bg-info/10 px-3 py-2 text-sm text-info">
            {syncMessage}
          </p>
        )}
      </Card>

      {!readOnly && (
      <Card className="p-4 sm:p-5">
        <CardTitle className="mb-4">手動新增球員</CardTitle>
        <div className="grid gap-3">
          <Input
            placeholder="DUPR 名稱"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="min-h-11 text-base"
          />
          <Input
            placeholder="顯示名稱（選填，預設同 DUPR 名稱）"
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
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
      </Card>
      )}

      <Card className="p-4 sm:p-5">
        <div className="mb-4 space-y-3">
          <CardTitle>球員列表</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/70" />
            <Input
              placeholder="搜尋顯示名稱、DUPR 名稱或 DUPR ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-11 pl-9 text-base"
            />
          </div>
          <p className="text-xs text-muted">
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
          <table className="w-full min-w-[880px]">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">DUPR 名稱</th>
                <th className="px-3 py-2 font-medium">顯示名稱</th>
                <th className="px-3 py-2 font-medium">DUPR ID</th>
                <th className="px-3 py-2 font-medium">評分</th>
                <th className="px-3 py-2 font-medium">狀態</th>
                {!readOnly && (
                  <th className="px-3 py-2 font-medium">操作</th>
                )}
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
          <p className="py-8 text-center text-sm text-muted">尚無球員資料</p>
        )}
        {players.length > 0 && filteredPlayers.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">
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

        {error && (
          <p className="alert-danger mt-3">
            {error}
          </p>
        )}
      </Card>
    </div>
  );
}
