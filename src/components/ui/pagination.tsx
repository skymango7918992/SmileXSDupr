"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: Props) {
  if (totalItems === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-center text-xs text-slate-500 sm:text-left">
        顯示 {from}–{to} / 共 {totalItems} 位
      </p>

      <div className="flex items-center justify-center gap-2">
        <Button
          variant="secondary"
          size="lg"
          className="min-h-11 flex-1 sm:flex-none sm:px-4"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="上一頁"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sm:inline">上一頁</span>
        </Button>

        <span className="min-w-[4.5rem] text-center text-sm font-medium text-slate-700">
          {page} / {totalPages}
        </span>

        <Button
          variant="secondary"
          size="lg"
          className="min-h-11 flex-1 sm:flex-none sm:px-4"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="下一頁"
        >
          <span className="sm:inline">下一頁</span>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
