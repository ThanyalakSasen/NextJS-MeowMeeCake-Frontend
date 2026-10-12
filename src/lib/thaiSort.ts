// ─────────────────────────────────────────────────────────────
// เรียงตามพจนานุกรมไทย (ก-ฮ) — ใช้กับตัวเลือกที่มาจากข้อมูล (หมวดหมู่ · สินค้า · หน่วย · พนักงาน ฯลฯ)
// ใช้ collation "th" เสมอ (ไม่ขึ้นกับภาษาที่เลือก): สระหน้า เ แ โ ใ ไ ไม่นับ — "เค้ก" อยู่หมวด ค · ตัวเลขเรียงแบบตัวเลข (2 < 10)
// ตัวเลือกที่มีลำดับตามความหมาย (สถานะ · ช่วงเวลา · วิธีเรียง) ไม่ต้องใช้
// ─────────────────────────────────────────────────────────────
const collator = new Intl.Collator("th", { numeric: true, sensitivity: "base" });

export const thaiCompare = (a: string, b: string): number => collator.compare(a, b);

/** คืน array ใหม่ เรียงตามข้อความจาก key */
export function sortByThai<T>(items: readonly T[], key: (item: T) => string): T[] {
  return [...items].sort((a, b) => thaiCompare(key(a), key(b)));
}

/** ตัวเลือกของ <Select> — เรียงตาม label */
export function sortOptionsThai<T extends { label: string }>(options: readonly T[]): T[] {
  return sortByThai(options, (o) => o.label);
}
