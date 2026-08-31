"use client";
// ─────────────────────────────────────────────────────────────
// DataTable — ตารางข้อมูล reusable (loading / empty / row action / pagination)
// ใช้ CSS class .data-table จาก globals.css · columns.title = ข้อความที่แปลแล้ว
// ─────────────────────────────────────────────────────────────
import { LoadingSpin } from "@/components/shared/feedback";
import { EmptyState } from "@/components/base";
import { PaginationBar } from "./PaginationBar";

export interface Column<T> {
  key: string;
  title: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: number | string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey?: (row: T) => string;
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (row: T) => void;
  /** คอลัมน์ท้ายสุด — ปุ่ม action ต่อแถว */
  actions?: (row: T) => React.ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyText,
  onRowClick,
  actions,
  pagination,
}: DataTableProps<T>) {
  if (loading) return <LoadingSpin />;
  if (rows.length === 0) return <EmptyState description={emptyText} />;

  const keyOf = (row: T, i: number) =>
    rowKey ? rowKey(row) : ((row as { _id?: string })._id ?? String(i));

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ textAlign: c.align, width: c.width }}>
                  {c.title}
                </th>
              ))}
              {actions && <th style={{ width: 1 }} />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={keyOf(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? "cursor-pointer" : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} style={{ textAlign: c.align }}>
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
                {actions && (
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <PaginationBar
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={pagination.onChange}
        />
      )}
    </div>
  );
}
