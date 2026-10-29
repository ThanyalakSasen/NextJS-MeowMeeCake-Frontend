"use client";
import { cloneElement, isValidElement } from "react";
import { Pagination, type PaginationProps } from "antd";

// antd วาดเลขหน้า/ปุ่ม «» เป็น <a rel="nofollow"> ไม่มี href (คลิกจริงอยู่ที่ <li> ครอบ) → Lighthouse SEO
// "Links are not crawlable" (หน้ารายงานความคิดเห็น SEO 91) · ใส่ role="none" = บอกว่าไม่ใช่ลิงก์ — audit ข้าม ·
// ยังเป็น <a> เดิม สไตล์ antd (.ant-pagination-item a) ไม่เปลี่ยน · โฟกัส/คีย์บอร์ดอยู่ที่ <li> เหมือนเดิม
const itemRender: PaginationProps["itemRender"] = (_page, _type, original) =>
  isValidElement(original) && original.type === "a" ? cloneElement(original as React.ReactElement<{ role?: string }>, { role: "none" }) : original;

/** ตัวเลือกขนาดหน้าที่เล็กที่สุดของ antd Pagination (pageSizeOptions ค่าเริ่มต้น 10/20/50/100) */
const MIN_PAGE_SIZE = 10;

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
  // พอดีหน้าเดียวทั้งขนาดหน้าปัจจุบันและขนาดเล็กสุด (10) — แถบไม่มีอะไรให้กด · ไม่วาด antd Pagination + Select ขนาดหน้า
  // (หน้าจัดการคำสั่งซื้อมีตารางแจ้งเตือนทีละ 1–3 แถวหลายกล่อง = Pagination หลายชุดที่ต้อง hydrate เปล่า ๆ)
  // เทียบกับ pageSize ด้วย — หน้าที่ใช้ขนาดหน้าเล็กกว่า 10 (สูตร = 9) ยังต้องมีแถบเมื่อเกินหน้าเดียว
  if (total <= Math.min(pageSize, MIN_PAGE_SIZE)) return null;
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
