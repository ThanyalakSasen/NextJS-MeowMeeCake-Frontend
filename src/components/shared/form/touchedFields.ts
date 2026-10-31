// ─────────────────────────────────────────────────────────────
// ฟอร์มที่เก็บค่าเป็น state เอง (ไม่ใช่ antd Form) — ตรวจสดทุกครั้งที่แก้ แต่โชว์เตือนเฉพาะช่องที่ผู้ใช้แตะแล้ว
// (ฟอร์มเพิ่มใหม่ไม่ขึ้นตัวแดงทุกช่องตั้งแต่เปิด) · ปุ่มบันทึก disabled ตามผลตรวจทั้งหมด (ผู้ใช้ขอ 2026-10-31)
// ─────────────────────────────────────────────────────────────

/** key ที่ค่าเปลี่ยนระหว่าง prev → next (เทียบแบบ JSON ต่อ key) */
export function changedKeys<T extends object>(prev: T, next: T): string[] {
  return (Object.keys(next) as (keyof T)[])
    .filter((k) => JSON.stringify(prev[k]) !== JSON.stringify(next[k]))
    .map(String);
}

/** เฉพาะ error ของช่องที่แตะแล้ว */
export function touchedOnly<E extends object>(errors: E, touched: ReadonlySet<string>): Partial<E> {
  return Object.fromEntries(Object.entries(errors).filter(([k]) => touched.has(k))) as Partial<E>;
}
