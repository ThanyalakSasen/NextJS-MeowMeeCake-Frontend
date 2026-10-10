"use client";
// ─────────────────────────────────────────────────────────────
// EditableRows — รายการแถวที่เพิ่ม/แก้/ลบได้ในฟอร์ม (เลือกสินค้า + จำนวน ฯลฯ)
//
// เดิม RoundFormModal กับ ProductionOrderFormModal เขียน updateRow + ปุ่มลบแถว
// เหมือนกันทุกตัวอักษรคนละไฟล์ (CONSISTENCY_AUDIT ข้อ 3.14 A4)
//
//   const { rows, setRows, updateRow, removeRow } = useEditableRows<ItemRow>([emptyRow()]);
//   <RemoveRowButton onClick={() => removeRow(row.key)} disabled={rows.length === 1} />
//
// ปุ่มลบมี aria-label ในตัว — ปุ่มไอคอนล้วนต้องมีเสมอ (ACTION_BUTTONS.md §4.1)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useTranslations } from "next-intl";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/base";

/** แถวต้องมี key ไว้ให้ React และ updateRow/removeRow อ้างถึง */
export interface EditableRow {
  key: string;
}

export function useEditableRows<T extends EditableRow>(initial: T[] = []) {
  const [rows, setRows] = useState<T[]>(initial);

  const updateRow = (key: string, patch: Partial<T>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const removeRow = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));

  const addRow = (row: T) => setRows((prev) => [...prev, row]);

  return { rows, setRows, updateRow, removeRow, addRow };
}

/** ปุ่ม ✕ ท้ายแถว — ตั้งใจให้มีแต่ไอคอน (แถวแน่น ใส่คำแล้วเบียดช่องกรอก · ACTION_BUTTONS.md §4.1) */
export function RemoveRowButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const t = useTranslations();
  return (
    <Button
      size="small"
      type="text"
      danger
      disabled={disabled}
      icon={<XMarkIcon className="h-3.5 w-3.5" />}
      onClick={onClick}
      aria-label={t("common.delete")}
    />
  );
}
