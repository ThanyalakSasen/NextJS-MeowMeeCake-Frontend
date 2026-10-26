"use client";
// แถบขั้นตอนการสั่งซื้อของลูกค้า (BACKLOG4 U8 · ตาม FrontOffice FlowSteps)
// ทุกแบบ (ออเดอร์/พรีออเดอร์ — ใช้ตะกร้าเดียวกันแล้ว): 1 ตะกร้าสินค้า → 2 ยืนยันคำสั่งซื้อ → 3 ชำระเงิน / แนบสลิป → 4 สั่งซื้อสำเร็จ
// แสดงแถวเดียวเสมอ (2026-10-26) — 4 คอลัมน์เท่ากัน · วงกลมเลขอยู่บน ชื่อขั้นอยู่ล่าง · เส้นเชื่อมระหว่างวงกลม (จอแคบก็ไม่ตกบรรทัด)
// current เริ่มที่ 1 — ขั้นที่ผ่านแล้ว ✓ สีเขียว · ขั้นปัจจุบันสีน้ำตาลเข้ม · ขั้นถัดไปสีเทา
import { useTranslations } from "next-intl";

export default function FlowSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  const t = useTranslations("shop.flow");
  const steps = [t("cart"), t("confirm"), t("pay"), t("done")];

  return (
    <ol className="m-0 grid w-full mx-auto max-w-xl list-none grid-cols-4 p-0 text-[11px] font-semibold sm:text-xs" aria-label={t("aria")}>
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="relative flex flex-col items-center gap-1 text-center" aria-current={active ? "step" : undefined}>
            {/* เส้นเชื่อมไปขั้นถัดไป — จากกลางวงกลมนี้ถึงกลางวงกลมถัดไป (อยู่หลังวงกลม) */}
            {n < steps.length && (
              <span
                className={`absolute left-1/2 top-3 h-px w-full ${done ? "bg-emerald-600" : "bg-stone-300"}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                done ? "bg-emerald-600 text-white" : active ? "bg-[#4A342E] text-white" : "bg-stone-200 text-stone-500"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <span className={`px-0.5 leading-tight ${active ? "text-[#4A342E]" : done ? "text-emerald-700" : "text-stone-500"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
