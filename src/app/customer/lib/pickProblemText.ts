// ข้อความของปัญหาตอนเลือกตัวเลือกสินค้า (src/lib/customizationSelection.ts checkPicked)
// POS ใช้ i18n pos.pick* · หน้าร้านเป็นภาษาไทยตรง ๆ (customer/ ยกเว้นจาก check-i18n)
import type { PickProblem } from "@/lib/customizationSelection";

export function pickProblemText(p: PickProblem): string {
  const { group, option, n } = p.params;
  switch (p.key) {
    case "pickGroupRequired":
      return `กรุณาเลือก${group}`;
    case "pickGroupMin":
      return `${group}: เลือกอย่างน้อย ${n} อย่าง`;
    case "pickGroupMax":
      return `${group}: เลือกได้ไม่เกิน ${n} อย่าง`;
    case "pickOptionRequired":
      return `กรุณาเลือก${option}`;
    case "pickTextRequired":
      return `กรุณากรอก${option}`;
    case "pickTextTooLong":
      return `${option}: ยาวไม่เกิน ${n} ตัวอักษร`;
  }
}
