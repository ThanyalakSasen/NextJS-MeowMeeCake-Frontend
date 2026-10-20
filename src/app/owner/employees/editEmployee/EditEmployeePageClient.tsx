"use client";
import { useEditEmployeeViewModel } from "./useEditEmployeeViewModel";
import { EditEmployeeView } from "./EditEmployeeView";

// ไม่ห่อ <Suspense> — หน้านี้ render ตอน request (page.tsx อ่าน cookie/searchParams) useSearchParams (?id=) จึงไม่ต้องมี
// boundary (บังคับเฉพาะหน้า static) · ถ้าห่อ React 19.2 แยกเนื้อหาไปท้าย HTML แล้วค่อยสลับเข้าที่หลัง JS หลักทำงาน
// (ดู orders/manageOrders/ManageOrdersPageClient.tsx)
export default function EditEmployeePage() {
  const vm = useEditEmployeeViewModel();
  return <EditEmployeeView {...vm} />;
}
