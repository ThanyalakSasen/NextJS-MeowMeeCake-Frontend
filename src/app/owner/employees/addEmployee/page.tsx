import { HydrationBoundary } from "@tanstack/react-query";
import { rolesService } from "@/services/roles";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import AddEmployeePage from "./AddEmployeePageClient";
import { ROLES_KEY } from "../employeesQuery";

// เพิ่มพนักงาน — ดึงรายการตำแหน่ง (ตัวเลือกในฟอร์ม) ฝั่ง server ด้วย cookie ของผู้ใช้ แล้วส่งฟอร์มมาใน HTML แรก
// เดิมฟอร์มขึ้นหลัง JS ทำงาน (Lighthouse มือถือ Performance 74 · LCP 4.3 วิ) · key ร่วมกับฟอร์มที่ employeesQuery.ts
export default async function AddEmployeeRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(h ? [{ queryKey: [...ROLES_KEY], queryFn: () => rolesService.list(h) }] : []);
  return (
    <HydrationBoundary state={state}>
      <AddEmployeePage />
    </HydrationBoundary>
  );
}
