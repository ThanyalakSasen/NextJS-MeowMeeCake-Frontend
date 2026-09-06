// ─────────────────────────────────────────────────────────────
// src/utils/dateRange.ts — pure: ตัวเลือกเดือนย้อนหลังสำหรับ filter แบบ "เลือกเดือน"
// ใช้ร่วมกัน ≥ 2 หน้า (Production History, Finance Expenses)
// ─────────────────────────────────────────────────────────────

/** ตัวเลือกเดือนย้อนหลัง (ค่าใหม่สุดก่อน) — value = "YYYY-MM", label ตาม locale */
export function buildMonthOptions(locale: string, count = 6): { value: string; label: string }[] {
  const now = new Date();
  const tag = locale === "en" ? "en-US" : "th-TH";
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat(tag, { month: "long", year: "numeric" }).format(d);
    return { value, label };
  });
}
