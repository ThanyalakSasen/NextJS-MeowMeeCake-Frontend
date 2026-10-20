// ─────────────────────────────────────────────────────────────
// instrumentation — เรียกครั้งเดียวตอน server เริ่ม (ก่อนรับ request)
// ตั้ง timezone ของ server เป็นเวลาไทย: ผู้ใช้ทั้งหมดอยู่ไทย · หน้าหลังร้านหลายหน้า render ฝั่ง server แล้ว (SSR_PAGES)
// และคำนวณช่วงวัน/เดือนด้วย dayjs (เวลาท้องถิ่น) — server (Vercel = UTC) กับ browser ต้องได้ช่วงเดียวกัน
// ไม่งั้นยอดรวม/รายการที่ขอบเดือนต่างกัน → hydration ไม่ตรง + query key ไม่ตรงกับที่ prefetch ไว้
// Node อ่าน process.env.TZ ใหม่ทันทีที่ตั้งค่า (ไม่ต้อง restart)
// ─────────────────────────────────────────────────────────────
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") process.env.TZ = "Asia/Bangkok";
}
