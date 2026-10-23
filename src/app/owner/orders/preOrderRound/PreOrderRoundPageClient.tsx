"use client";
import { usePreOrderRoundViewModel } from "./usePreOrderRoundViewModel";
import { PreOrderRoundView } from "./PreOrderRoundView";

// ไม่ห่อ <Suspense> — หน้านี้ render ตอน request (page.tsx อ่าน cookie/searchParams) useSearchParams (sync ?tab=)
// จึงไม่ต้องมี boundary (บังคับเฉพาะหน้า static) · ถ้าห่อ React 19.2 แยกเนื้อหาก้อนใหญ่ออกไปท้าย HTML แล้วค่อย
// สลับเข้าที่ด้วยสคริปต์ซึ่งรันหลัง JS หลักทำงานเสร็จ → หัวข้อ/ตารางขึ้นช้า (Lighthouse LCP render delay ~2 วิ)
export default function PreOrderRoundPage() {
  const vm = usePreOrderRoundViewModel();
  return <PreOrderRoundView {...vm} />;
}
