import { Button } from "@/components/ui/button";

type PaginationBarProps = {
  current: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  ariaLabel?: string;
};

export function PaginationBar({
  current,
  pageSize,
  total,
  onPageChange,
  itemLabel = "个题库",
  ariaLabel = "分页",
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <nav
      aria-label={ariaLabel}
      className="flex flex-col items-center justify-between gap-3 rounded-xl border bg-bg-surface px-4 py-3 text-sm text-text-secondary sm:flex-row"
    >
      <span>
        共 {total} {itemLabel} · 第 {current} / {totalPages} 页
      </span>
      <div className="flex items-center gap-2">
        <Button
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          size="sm"
          variant="outline"
        >
          上一页
        </Button>
        <Button
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
          size="sm"
        >
          下一页
        </Button>
      </div>
    </nav>
  );
}
