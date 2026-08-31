"use client";
import { Pagination } from "antd";
/** แถบแบ่งหน้า — wrap antd Pagination ให้ค่าเริ่มต้นเหมือนกันทั้งแอป */
export function PaginationBar({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="flex justify-end pt-3">
      <Pagination
        current={page}
        pageSize={pageSize}
        total={total}
        onChange={onChange}
        showSizeChanger
        size="small"
      />
    </div>
  );
}
