import { useState } from "react";

/**
 * true ตั้งแต่ open เป็น true ครั้งแรกเป็นต้นไป — ใช้ mount โมดัล/ลิ้นชักที่โหลดแบบ next/dynamic เมื่อเปิดครั้งแรก
 * แล้วคาไว้ (แอนิเมชันปิด/สถานะฟอร์มเหมือนเดิม) · ไม่เคยเปิด = ไม่โหลด chunk ไม่ต้อง render ตอนเปิดหน้า
 */
export function useOpenedOnce(open: boolean): boolean {
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);
  return opened;
}
