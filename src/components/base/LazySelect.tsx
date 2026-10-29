"use client";
// ─────────────────────────────────────────────────────────────
// LazySelect — antd <Select> ที่สร้าง "เมื่อกดครั้งแรก" (สำหรับช่องเลือกในแถวตาราง ทีละหลายตัว)
//
// ทำไม: antd Select หนึ่งตัวมี Trigger/Portal/ResizeObserver/cssinjs ของตัวเอง สร้างครบตอน hydrate แม้ยังไม่มีใครเปิด
// หน้าจัดการคำสั่งซื้อมีช่องเปลี่ยนสถานะทุกแถว (ตารางแจ้งเตือน + ตารางหลัก) → Lighthouse มือถือ TBT สูง
// ก่อนกด = กล่องหน้าตาเหมือนช่องเลือก (สูง/ขอบ/มุม/ลูกศรเดียวกัน) แสดง label ของค่าที่เลือก
// กด (หรือ Enter/Space/↓) = สลับเป็น antd Select แล้วเปิดรายการทันที — สลับตอน click (หลัง mouseup) ไม่ใช่ pointerdown:
//   สลับตอนกดลง mouseup/click ที่ตามมาจะตกที่ Select ตัวใหม่แล้วปิดรายการที่เพิ่งเปิด · disabled = กล่องเฉย ๆ ไม่สร้าง Select เลย
// รองรับเฉพาะ options แบบแบน { value, label } (ไม่มี group) — ใช้แทน <Select> ได้ทุก prop
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { Select as AntSelect, type SelectProps } from "antd";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const OPEN_KEYS = new Set(["Enter", " ", "ArrowDown"]);

export function LazySelect(props: SelectProps) {
  const [armed, setArmed] = useState(false);
  if (armed) return <AntSelect {...props} defaultOpen autoFocus />;

  const label = props.options?.find((o) => o.value === props.value)?.label ?? props.value;
  // สูง 40px ทุกขนาด (control.heightSM = height = 40 ใน theme) · small ต่างแค่มุม (borderRadiusSM)
  const small = props.size === "small";
  return (
    <span
      role="button"
      aria-haspopup="listbox"
      tabIndex={props.disabled ? -1 : 0}
      aria-label={props["aria-label"]}
      aria-disabled={props.disabled || undefined}
      onClick={props.disabled ? undefined : () => setArmed(true)}
      onKeyDown={
        props.disabled
          ? undefined
          : (e) => {
              if (!OPEN_KEYS.has(e.key)) return;
              e.preventDefault();
              setArmed(true);
            }
      }
      style={props.style}
      className={`inline-flex h-[40px] items-center justify-between gap-2 border border-[#e4dad1] px-[11px] align-middle transition-colors ${
        small ? "rounded-md" : "rounded-lg"
      } ${
        props.disabled
          ? "cursor-not-allowed bg-black/[0.04] text-black/25"
          : "cursor-pointer bg-white hover:border-brown-700 focus-visible:border-brown-800 focus-visible:outline-none"
      }`}
    >
      <span className="truncate">{label}</span>
      <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden="true" />
    </span>
  );
}
