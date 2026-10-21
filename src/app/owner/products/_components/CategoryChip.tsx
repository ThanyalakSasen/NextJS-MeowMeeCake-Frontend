"use client";
// ชิปกรองหมวดหมู่ — อยู่ใต้ TypeTabBar บนหน้าสินค้า สองแถวนี้จึงต้องบอก "เลือกอยู่" ด้วยภาษาเดียวกัน
// (น้ำตาลทึบ + ตัวอักษรขาว) — เดิมใช้ bg-brown-50 ซึ่งจางมากจนดูไม่ออกว่าเลือกอันไหน
// ไม่มีจุดสีหน้าชื่อหมวด (เดิมสุ่มสีจากชื่อ — สีไม่มีความหมาย เจ้าของร้านขอเอาออก)
export function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center h-[36px] rounded-full border px-3.5 text-sm transition-colors ${
        active
          ? "border-brown-800 bg-brown-800 font-medium text-white"
          : "border-gray-300 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}
