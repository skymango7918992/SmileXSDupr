"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function KhpaPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  className,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);

  if (totalItems <= pageSize) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-center text-xs text-muted sm:text-left">
        顯示 {start}–{end} / 共 {totalItems} 人
      </p>
      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="btn-touch"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="上一頁"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[4.5rem] text-center text-sm font-medium tabular-nums">
          {safePage} / {totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="btn-touch"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="下一頁"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
