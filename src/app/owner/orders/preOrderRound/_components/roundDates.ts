// วันที่ของรอบจาก DatePicker (เลือกแค่วัน) → เวลาที่ส่งให้ backend
// DatePicker แบบไม่มีเวลาติดเวลาปัจจุบันตอนกดเลือกมาด้วย — เดิมรอบจึงปิดกลางวัน (เวลาที่บังเอิญกดสร้าง)
// เจ้าของร้าน 2026-10-22: ปิดรับ "ถึงสิ้นวัน" ที่กำหนด แล้วรอบปิดเองอัตโนมัติ
//   open = ต้นวัน · close = สิ้นวัน (23:59:59) · pickup = สิ้นวันเหมือน close → ระยะ close→pickup เป็นจำนวนวันเต็ม
//   (backend ตรวจ pickup − close ≥ lead_time_days ของสินค้า)
import type { Dayjs } from "dayjs";

export function roundDatesPayload(v: { open_date: Dayjs; close_date: Dayjs; pickup_date: Dayjs }) {
  return {
    open_date: v.open_date.startOf("day").toISOString(),
    close_date: v.close_date.endOf("day").toISOString(),
    pickup_date: v.pickup_date.endOf("day").toISOString(),
  };
}

/** ข้อความเตือนวันที่ผิดลำดับ (เทียบระดับวัน) — null = ถูกต้อง */
export function roundDatesError(v: { open_date: Dayjs; close_date: Dayjs; pickup_date: Dayjs }) {
  if (v.close_date.isBefore(v.open_date, "day")) return "preorderRound.openBeforeCloseRequired" as const;
  if (v.pickup_date.isBefore(v.close_date, "day")) return "preorderRound.pickupAfterCloseRequired" as const;
  return null;
}
