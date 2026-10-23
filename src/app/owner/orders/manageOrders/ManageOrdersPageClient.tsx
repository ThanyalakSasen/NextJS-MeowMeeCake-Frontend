"use client";
import { useManageOrdersViewModel } from "./useManageOrdersViewModel";
import { ManageOrdersView } from "./ManageOrdersView";

// ไม่ห่อ <Suspense> — หน้านี้ render ตอน request (page.tsx อ่าน cookie) useSearchParams จึงไม่ต้องมี boundary
// (บังคับเฉพาะหน้า static) · ถ้าห่อ React 19.2 แยกเนื้อหาก้อนใหญ่ออกไปท้าย HTML แล้วค่อยสลับเข้าที่ด้วยสคริปต์
// ซึ่งรันหลัง JS หลักทำงานเสร็จ → หัวข้อ/ตารางขึ้นช้า (Lighthouse LCP render delay ~2 วิ)
export default function ManageOrdersPage() {
  const vm = useManageOrdersViewModel();
  return <ManageOrdersView {...vm} />;
}
