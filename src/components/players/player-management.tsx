"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2, UserCheck, UserX } from "lucide-react";
import {
  createPlayer,
  deletePlayer,
  updatePlayer,
} from "@/lib/actions/players";
import type { Player } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  initialPlayers: Player[];
};

export function PlayerManagement({ initialPlayers }: Props) {
  const [players, setPlayers] = useState(initialPlayers);
  const [name, setName] = useState("");
  const [duprId, setDuprId] = useState("");
  const [rating, setRating] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setName("");
    setDuprId("");
    setRating("");
    setEditingId(null);
  };

  const refreshFromServer = async () => {
    const { getPlayers } = await import("@/lib/actions/players");
    const data = await getPlayers();
    setPlayers(data);
  };

  const handleSubmit = () => {
    if (!name.trim() || !duprId.trim()) {
      setError("請填寫姓名與 DUPR ID");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const ratingValue = rating ? Number(rating) : null;
        if (editingId) {
          await updatePlayer(editingId, {
            name,
            dupr_id: duprId,
            dupr_rating: ratingValue,
          });
        } else {
          await createPlayer({
            name,
            dupr_id: duprId,
            dupr_rating: ratingValue,
          });
        }
        resetForm();
        await refreshFromServer();
      } catch (e) {
        setError(e instanceof Error ? e.message : "操作失敗");
      }
    });
  };

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setName(player.name);
    setDuprId(player.dupr_id);
    setRating(player.dupr_rating?.toString() ?? "");
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
        await deletePlayer(player.id);
        await refreshFromServer();
      } catch (e) {
        setError(e instanceof Error ? e.message : "刪除失敗");
      }
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle className="mb-4">
          {editingId ? "編輯球員" : "新增球員"}
        </CardTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="姓名"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="DUPR ID"
            value={duprId}
            onChange={(e) => setDuprId(e.target.value.toUpperCase())}
          />
          <Input
            placeholder="DUPR 評分（選填）"
            type="number"
            step="0.01"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleSubmit} disabled={isPending}>
            <Plus className="h-4 w-4" />
            {editingId ? "儲存" : "新增"}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={resetForm}>
              取消
            </Button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      <Card>
        <CardTitle className="mb-4">球員列表</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="px-3 py-2 font-medium">姓名</th>
                <th className="px-3 py-2 font-medium">DUPR ID</th>
                <th className="px-3 py-2 font-medium">評分</th>
                <th className="px-3 py-2 font-medium">狀態</th>
                <th className="px-3 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className="border-b border-gray-50">
                  <td className="px-3 py-3 text-sm font-medium">{player.name}</td>
                  <td className="px-3 py-3 text-sm text-gray-600">
                    {player.dupr_id}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600">
                    {player.dupr_rating ?? "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        player.active
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                          : "rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                      }
                    >
                      {player.active ? "有效" : "停用"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => startEdit(player)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toggleActive(player)}
                      >
                        {player.active ? (
                          <UserX className="h-3.5 w-3.5" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(player)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {players.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-500">
              尚無球員資料
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
