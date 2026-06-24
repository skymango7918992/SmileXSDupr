"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus, RefreshCw, Search, Trash2, UserPlus } from "lucide-react";
import {
  createKhpaPlayer,
  deleteKhpaPlayer,
  getKhpaAllPlayers,
  updateKhpaPlayer,
} from "@/lib/actions/khpa/players";
import { syncKhpaDuprClubMembers } from "@/lib/actions/khpa/dupr-sync";
import { getDuprEnvStatusAction } from "@/lib/actions/dupr-config";
import { KhpaBadgeAvatar, KhpaBadgePill } from "@/components/khpa/badge-avatar";
import { AvatarGenderToggle } from "@/components/cultivation/avatar-gender-toggle";
import {
  formatAvatarGenderLabel,
  type PlayerAvatarGender,
} from "@/lib/cultivation-tiers";
import { KhpaPagination } from "@/components/khpa/khpa-pagination";
import { useAppUi } from "@/components/providers/app-ui-provider";
import type { KhpaLeaderboardEntry, KhpaPlayer } from "@/types/khpa";
import type { DuprConfigMode, DuprEnvStatus } from "@/types/dupr";
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
  const [newName, setNewName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newDuprId, setNewDuprId] = useState("");
  const [newRating, setNewRating] = useState("");
  const [newAvatarGender, setNewAvatarGender] =
    useState<PlayerAvatarGender | null>(null);
  const [active, setActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [duprConfigMode, setDuprConfigMode] = useState<DuprConfigMode | null>(null);
  const [duprEnvStatus, setDuprEnvStatus] = useState<DuprEnvStatus | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { success, error: toastError, confirm } = useAppUi();

  const playerStats = Object.fromEntries(
    leaderboard.map((e) => [
      e.playerId,
      { wins: e.wins, winRate: e.winRate },
    ]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.display_name.toLowerCase().includes(q) ||
        (p.name ?? "").toLowerCase().includes(q) ||
        p.dupr_id.toLowerCase().includes(q),
    );
  }, [list, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const clubCount = list.filter((p) => p.source === "club").length;
  const manualCount = list.filter((p) => (p.source ?? "manual") === "manual").length;

  useEffect(() => {
    void getDuprEnvStatusAction().then((status) => {
      setDuprEnvStatus(status);
      setDuprConfigMode(status.mode);
    });
  }, []);

  const refreshList = async () => {
    const data = await getKhpaAllPlayers();
    setList(data);
  };

  const handleDuprSync = () => {
    setSyncMessage(null);
    startTransition(async () => {
      try {
        const result = await syncKhpaDuprClubMembers();
        setSyncMessage(
          `Club ${result.clubTotal} 人 · 新增 ${result.added} · 更新 ${result.updated} · 手動轉 Club ${result.converted}${result.deactivated ? ` · 停用 ${result.deactivated}` : ""}`,
        );
        await refreshList();
        success("DUPR 名單已同步至協會球員");
      } catch (e) {
        toastError(e instanceof Error ? e.message : "DUPR 同步失敗");
      }
    });
  };

  const handleCreate = () => {
    const name = newName.trim() || newDisplayName.trim();
    if (!name || !newDuprId.trim()) {
      toastError("請輸入姓名與 DUPR ID");
      return;
    }
    startTransition(async () => {
      try {
        const player = await createKhpaPlayer({
          name: newName.trim() || newDisplayName.trim(),
          display_name: newDisplayName.trim() || newName.trim(),
          dupr_id: newDuprId,
          active,
          dupr_rating: newRating ? Number(newRating) : null,
          ...(newAvatarGender ? { avatar_gender: newAvatarGender } : {}),
        });
        setList((prev) =>
          [...prev, player].sort((a, b) => {
            if (a.active !== b.active) return a.active ? -1 : 1;
            return a.display_name.localeCompare(b.display_name, "zh-Hant");
          }),
        );
        setNewName("");
        setNewDisplayName("");
        setNewDuprId("");
        setNewRating("");
        setNewAvatarGender(null);
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
    player: KhpaPlayer,
    input: {
      name: string;
      displayName: string;
      duprId: string;
      isActive: boolean;
      rating: string;
      avatarGender: PlayerAvatarGender | null;
    },
  ) => {
    startTransition(async () => {
      try {
        const isClub = player.source === "club";
        if (isClub) {
          await updateKhpaPlayer(player.id, {
            display_name: input.displayName,
            display_name_customized:
              input.displayName.trim() !== player.name,
            active: input.isActive,
            avatar_gender: input.avatarGender,
          });
        } else {
          await updateKhpaPlayer(player.id, {
            name: input.name,
            display_name: input.displayName,
            dupr_id: input.duprId,
            active: input.isActive,
            dupr_rating: input.rating ? Number(input.rating) : null,
            avatar_gender: input.avatarGender,
          });
        }
        await refreshList();
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
            與星鑽 XS 共用 DUPR Club · Club {clubCount} 人 · 手動 {manualCount} 人
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

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">DUPR Club 同步</CardTitle>
            <p className="mt-1 text-sm text-muted">
              Club {duprEnvStatus?.khpaClubId || "（請至設定頁填入）"} · 協會專用
              Club，與星鑽 XS 可分開設定
            </p>
            {duprConfigMode === "none" && (
              <p className="mt-2 text-xs text-muted">
                尚未設定 DUPR 連線，請由管理員在 Cloudflare Variables 設定
                DUPR_EMAIL / DUPR_PASSWORD 或 DUPR_API_TOKEN 後重新部署。
              </p>
            )}
          </div>
          <Button
            onClick={handleDuprSync}
            loading={isPending}
            disabled={
              (duprConfigMode !== "token" && duprConfigMode !== "credentials") ||
              !duprEnvStatus?.khpaClubId
            }
            className="btn-touch h-11 w-full shrink-0 sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            更新 Club 名單
          </Button>
        </div>
        {syncMessage && (
          <p className="mt-3 rounded-lg border border-info/25 bg-info/10 px-3 py-2 text-sm text-info">
            {syncMessage}
          </p>
        )}
      </Card>

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
          <CardTitle className="mb-3 text-base">手動新增球員</CardTitle>
          <div className="space-y-3">
            <Input
              placeholder="DUPR 名稱（必填）"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-11 text-base"
              autoFocus
            />
            <Input
              placeholder="顯示名稱（選填，預設同 DUPR 名稱）"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="h-11 text-base"
            />
            <Input
              placeholder="DUPR ID（必填）"
              value={newDuprId}
              onChange={(e) => setNewDuprId(e.target.value.toUpperCase())}
              className="h-11 font-mono"
              required
            />
            <Input
              placeholder="DUPR 評分（選填）"
              type="number"
              step="0.01"
              value={newRating}
              onChange={(e) => setNewRating(e.target.value)}
              className="h-11"
            />
            <AvatarGenderToggle
              value={newAvatarGender}
              onChange={setNewAvatarGender}
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
                disabled={!(newName.trim() || newDisplayName.trim()) || !newDuprId.trim()}
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
          <p className="text-muted">還沒有球員，請按「更新 Club 名單」或手動新增</p>
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
                  wins={playerStats[player.id]?.wins ?? 0}
                  winRate={playerStats[player.id]?.winRate}
                  gender={player.avatar_gender}
                  name={player.display_name}
                  size="md"
                />
                {editingId === player.id ? (
                  <EditRow
                    player={player}
                    loading={isPending}
                    onSave={(input) => handleUpdate(player, input)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{player.display_name}</p>
                        <KhpaBadgePill
                          wins={playerStats[player.id]?.wins ?? 0}
                          winRate={playerStats[player.id]?.winRate}
                          gender={player.avatar_gender}
                        />
                        <SourceBadge source={player.source ?? "manual"} />
                        {!player.active && (
                          <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[10px] text-muted">
                            停用
                          </span>
                        )}
                      </div>
                      {player.display_name !== player.name && (
                        <p className="text-xs text-muted">DUPR：{player.name}</p>
                      )}
                      <p className="text-xs text-muted">
                        {player.dupr_id}
                        {player.dupr_rating != null && ` · 評分 ${player.dupr_rating}`}
                        {" · 今年 "}
                        {playerStats[player.id]?.wins ?? 0} 勝
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
                          onClick={() =>
                            void handleDelete(player.id, player.display_name)
                          }
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

function SourceBadge({ source }: { source: "club" | "manual" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
        source === "club"
          ? "bg-primary/10 text-primary"
          : "bg-surface-muted text-muted",
      )}
    >
      {source === "club" ? "Club" : "手動"}
    </span>
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
  onSave: (input: {
    name: string;
    displayName: string;
    duprId: string;
    isActive: boolean;
    rating: string;
    avatarGender: PlayerAvatarGender | null;
  }) => void;
  onCancel: () => void;
}) {
  const isClub = player.source === "club";
  const [name, setName] = useState(player.name || player.display_name);
  const [displayName, setDisplayName] = useState(player.display_name);
  const [duprId, setDuprId] = useState(player.dupr_id);
  const [rating, setRating] = useState(player.dupr_rating?.toString() ?? "");
  const [isActive, setIsActive] = useState(player.active);
  const [avatarGender, setAvatarGender] = useState<PlayerAvatarGender | null>(
    player.avatar_gender ?? null,
  );

  return (
    <div className="flex flex-1 flex-col gap-2">
      {isClub ? (
        <p className="rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-sm">
          DUPR 名稱：{player.name}
        </p>
      ) : (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="DUPR 名稱"
          className="h-10"
        />
      )}
      <Input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="顯示名稱"
        className="h-10"
      />
      {isClub ? (
        <p className="rounded-md border border-border bg-surface-muted/40 px-3 py-2 font-mono text-sm">
          {duprId}
        </p>
      ) : (
        <Input
          value={duprId}
          onChange={(e) => setDuprId(e.target.value.toUpperCase())}
          placeholder="DUPR ID"
          className="h-10 font-mono"
        />
      )}
      {!isClub && (
        <Input
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          placeholder="DUPR 評分（選填）"
          type="number"
          step="0.01"
          className="h-10"
        />
      )}
      <AvatarGenderToggle value={avatarGender} onChange={setAvatarGender} />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        啟用
      </label>
      <div className="flex gap-1">
        <Button
          size="sm"
          loading={loading}
          onClick={() =>
            onSave({ name, displayName, duprId, isActive, rating, avatarGender })
          }
          disabled={!displayName.trim() || (!isClub && (!name.trim() || !duprId.trim()))}
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
