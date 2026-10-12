"use client";
// ─────────────────────────────────────────────────────────────
// DataTable — ตารางข้อมูล reusable (loading / empty / row action / pagination)
// ใช้ CSS class .data-table จาก globals.css · columns.title = ข้อความที่แปลแล้ว
// ไม่ส่ง pagination → แบ่งหน้าฝั่ง client ให้เอง (10 แถว/หน้า เปลี่ยนได้) · ส่ง pagination={false} = แสดงทุกแถว
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { LoadingSpin } from "@/components/shared/feedback";
import { EmptyState } from "@/components/base";
import { PaginationBar } from "./PaginationBar";

const DEFAULT_PAGE_SIZE = 10;

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
  /** แบ่งหน้าเอง (ViewModel ตัดแถวมาแล้ว) · ไม่ส่ง = DataTable ตัดหน้าให้จาก rows · false = ไม่แบ่งหน้า */
  pagination?:
    | {
        page: number;
        pageSize: number;
        total: number;
        onChange: (page: number, pageSize: number) => void;
      }
    | false;
  /** วางอยู่ในการ์ดอยู่แล้ว (section card ที่มีหัวข้อ) — ไม่วาดกรอบ/มุมมนซ้อนอีกชั้น + เว้นขอบให้แถบแบ่งหน้า */
  inCard?: boolean;
  /** class เพิ่มให้กล่อง scroll ของตาราง — เช่นกำหนดความสูงตายตัว (ดู .expense-table-scroll) */
  scrollClassName?: string;
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
  inCard,
  scrollClassName = "",
}: DataTableProps<T>) {
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(DEFAULT_PAGE_SIZE);
  // จำนวนแถวเปลี่ยน (กรอง/ค้นหา/ลบ) → กลับหน้าแรก — ตั้ง state ระหว่าง render ตามแบบ "ปรับ state เมื่อ prop เปลี่ยน"
  // เทียบจำนวนแถวแทนตัว array เพราะบางหน้าสร้าง rows ใหม่ทุก render
  const [seenCount, setSeenCount] = useState(rows.length);
  if (seenCount !== rows.length) {
    setSeenCount(rows.length);
    setLocalPage(1);
  }

  if (loading) return <LoadingSpin />;
  // ไม่ได้อยู่ในการ์ด → กล่องพื้นขาวเอง (พื้นหน้าหลังร้านเป็นสีครีม) ทั้งตอนมีข้อมูลและตอนว่าง
  const box = inCard ? "" : "rounded-xl border border-gray-100 bg-white";
  if (rows.length === 0) return inCard ? <EmptyState description={emptyText} /> : <div className={box}><EmptyState description={emptyText} /></div>;

  const local = pagination === undefined;
  const lastPage = Math.max(1, Math.ceil(rows.length / localPageSize));
  const page = Math.min(localPage, lastPage);
  const visible = local ? rows.slice((page - 1) * localPageSize, page * localPageSize) : rows;
  const pager = local
    ? {
        page,
        pageSize: localPageSize,
        total: rows.length,
        onChange: (p: number, ps: number) => {
          setLocalPage(ps === localPageSize ? p : 1);
          setLocalPageSize(ps);
        },
      }
    : pagination;

  const keyOf = (row: T, i: number) =>
    rowKey ? rowKey(row) : ((row as { _id?: string })._id ?? String(i));

  return (
    <div className="flex flex-col">
      <div className={`overflow-x-auto ${box} ${scrollClassName}`}>
        <table className="data-table">
          <thead>
            <tr>
              {/* หัวตารางอยู่กลางทุกคอลัมน์ (.data-table th) — align ของคอลัมน์มีผลกับเซลล์ข้อมูลเท่านั้น */}
              {columns.map((c) => (
                <th key={c.key} style={{ width: c.width }}>
                  {c.title}
                </th>
              ))}
              {actions && <th style={{ width: 1 }} />}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
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

      {pager && (
        <div className={inCard ? "border-t border-gray-100 px-4 pb-3" : undefined}>
          <PaginationBar
            page={pager.page}
            pageSize={pager.pageSize}
            total={pager.total}
            onChange={pager.onChange}
          />
        </div>
      )}
    </div>
  );
}
