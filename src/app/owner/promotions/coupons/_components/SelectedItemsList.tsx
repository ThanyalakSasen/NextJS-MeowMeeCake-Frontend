"use client";
// รายการที่เลือกไว้ (สินค้า/หมวดหมู่) แสดงเต็มด้านล่างช่อง Select — ตัว Select เองพอเลือกหลายรายการแล้ว
// tag จะถูกย่อเป็น "+N ..." เมื่อล้น ทำให้มองไม่เห็นครบทุกชื่อ พื้นที่นี้เลยโชว์ทุกชื่อเต็มๆ พร้อมกดลบออกได้ทีละรายการ
import { Tag } from "@/components/base";

export function SelectedItemsList({
  ids,
  options,
  onRemove,
}: {
  ids: string[];
  options: { value: string; label: string }[];
  onRemove: (id: string) => void;
}) {
  if (ids.length === 0) return null;
  return (
    <div className="-mt-2 mb-4 flex flex-col gap-1.5">
      {ids.map((id) => (
        <Tag key={id} closable onClose={(e) => { e.preventDefault(); onRemove(id); }} className="!m-0 flex !w-full items-center justify-between !py-1">
          {options.find((o) => o.value === id)?.label ?? id}
        </Tag>
      ))}
    </div>
  );
}
