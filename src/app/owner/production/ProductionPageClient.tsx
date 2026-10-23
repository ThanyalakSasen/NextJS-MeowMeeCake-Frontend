"use client";
import { useProductionViewModel } from "./useProductionViewModel";
import { ProductionView } from "./ProductionView";

// ไม่ห่อ <Suspense> — หน้านี้ render ตอน request (page.tsx อ่าน cookie) useSearchParams (sync ?tab=) จึงไม่ต้องมี
// boundary (บังคับเฉพาะหน้า static) · ถ้าห่อ React 19.2 แยกเนื้อหาก้อนใหญ่ไปท้าย HTML แล้วค่อยสลับเข้าที่ด้วยสคริปต์
// ที่รันหลัง JS หลัก → เนื้อหาขึ้นช้า (ดู orders/manageOrders/ManageOrdersPageClient.tsx)
export default function ProductionPage() {
  const vm = useProductionViewModel();
  return <ProductionView {...vm} />;
}
