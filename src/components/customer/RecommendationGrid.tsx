"use client";
// ─────────────────────────────────────────────────────────────
// ตารางสินค้าแนะนำ (หน้าแรก "สินค้าแนะนำ" · หน้าสินค้า "สินค้าที่คล้ายกัน") — แสดงเฉพาะแถวที่เต็ม ไม่มีแถวสุดท้ายแหว่ง
//   จอใหญ่ (≥1280) 4 คอลัมน์ สูงสุด 2 แถว: ครบ 8 = 2 แถว · ไม่ถึง 8 = 1 แถว (4)
//   จอกลาง (640–1279) 3 คอลัมน์ สูงสุด 2 แถว: ครบ 6 = 2 แถว · ไม่ถึง = 1 แถว (3)
//   มือถือ (<640) 2 คอลัมน์ สูงสุด 3 แถว: ครบ 6 = 3 แถว · ไม่ถึง 6 = 2 แถว (4)
//   มีน้อยกว่า 1 แถว = แสดงเท่าที่มี
// ซ่อนด้วย CSS ตามขนาดจอ (render ครั้งเดียว ไม่ต้องรู้ขนาดจอใน JS — ไม่กระพริบตอน hydrate)
// ─────────────────────────────────────────────────────────────

export const RECOMMENDATION_MAX = 10;

/** จำนวนที่แสดง = แถวเต็มเท่านั้น (ไม่ถึง 1 แถว = ทั้งหมด) */
export function fullRows(n: number, cols: number, maxRows: number): number {
  if (n < cols) return n;
  return Math.min(maxRows, Math.floor(n / cols)) * cols;
}

export default function RecommendationGrid<T>({ items, render }: { items: T[]; render: (item: T) => React.ReactNode }) {
  const n = items.length;
  const mobile = fullRows(n, 2, 3);
  const medium = fullRows(n, 3, 2);
  const large = fullRows(n, 4, 2);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
      {items.slice(0, RECOMMENDATION_MAX).map((item, i) => (
        // ชิ้นที่ i แสดงในจอขนาดไหนบ้าง — hidden/block ต่อ breakpoint (ตัวสุดท้ายที่ตั้งชนะ: base → sm → xl)
        <div
          key={i}
          className={`${i < mobile ? "block" : "hidden"} ${i < medium ? "sm:block" : "sm:hidden"} ${i < large ? "xl:block" : "xl:hidden"}`}
        >
          {render(item)}
        </div>
      ))}
    </div>
  );
}
