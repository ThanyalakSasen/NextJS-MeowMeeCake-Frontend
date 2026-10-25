"use client";
// ─────────────────────────────────────────────────────────────
// LazyTooltip — antd <Tooltip> ที่สร้างตอนชี้/โฟกัสครั้งแรก (หน้าตา/พฤติกรรมเหมือนเดิม)
// ใช้กับรายการที่มี tooltip ทีละหลายสิบตัว (แท่งกราฟรายวัน · แถวตาราง) — antd Tooltip หนึ่งตัวมี Trigger/Portal/
// ResizeObserver/motion ของตัวเอง สร้างทั้งหมดตอน hydrate แม้ยังไม่มีใครชี้ (หน้ารายงานความคิดเห็น ~50 ตัว →
// Lighthouse มือถือ TBT 600–750 ms) · ก่อนชี้ render แค่ลูกตัวเดิม (DOM เหมือนกัน — antd ไม่ครอบ element เพิ่ม)
// children ต้องเป็น element เดียวที่รับ onPointerEnter/onFocus ได้ (div/li/span …)
// ─────────────────────────────────────────────────────────────
import { cloneElement, useState, type ReactElement } from "react";
import { Tooltip } from "antd";

type Child = ReactElement<{ onPointerEnter?: (e: React.PointerEvent) => void; onFocus?: (e: React.FocusEvent) => void }>;

export function LazyTooltip({ title, children }: { title: React.ReactNode; children: Child }) {
  const [armed, setArmed] = useState(false);
  if (armed) {
    // defaultOpen: ตัวชี้อยู่บน element แล้วตอนสร้าง — เปิดทันที ไม่ต้องรอ pointerenter รอบใหม่
    return (
      <Tooltip title={title} defaultOpen>
        {children}
      </Tooltip>
    );
  }
  return cloneElement(children, {
    onPointerEnter: (e: React.PointerEvent) => {
      children.props.onPointerEnter?.(e);
      setArmed(true);
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      setArmed(true);
    },
  });
}
