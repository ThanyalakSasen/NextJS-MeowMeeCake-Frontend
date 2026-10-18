"use client";
import { cloneElement, isValidElement } from "react";
import { Pagination, type PaginationProps } from "antd";

// antd วาดเลขหน้า/ปุ่ม «» เป็น <a rel="nofollow"> ไม่มี href (คลิกจริงอยู่ที่ <li> ครอบ) → Lighthouse SEO
// "Links are not crawlable" (หน้ารายงานความคิดเห็น SEO 91) · ใส่ role="none" = บอกว่าไม่ใช่ลิงก์ — audit ข้าม ·
// ยังเป็น <a> เดิม สไตล์ antd (.ant-pagination-item a) ไม่เปลี่ยน · โฟกัส/คีย์บอร์ดอยู่ที่ <li> เหมือนเดิม
const itemRender: PaginationProps["itemRender"] = (_page, _type, original) =>
  isValidElement(original) && original.type === "a" ? cloneElement(original as React.ReactElement<{ role?: string }>, { role: "none" }) : original;

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
        itemRender={itemRender}
        showSizeChanger
        size="small"
      />
    </div>
  );
}
