import { HydrationBoundary } from "@tanstack/react-query";
import { usersService } from "@/services/users";
import { rolesService } from "@/services/roles";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import EmployeesPage from "./EmployeesPageClient";
import { ROLES_KEY, STAFF_KEY, STAFF_PARAMS } from "./employeesQuery";

// พนักงาน — ดึงรายชื่อพนักงาน + role ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมเนื้อหาขึ้นหลัง JS ทำงาน การ์ดสถิติขึ้น 0 ก่อนแล้วค่อยเปลี่ยน (Lighthouse มือถือ Performance 83 · LCP 3.8 วิ) ·
// key ร่วมกับ ViewModel ที่ employeesQuery.ts · backend ช้า → browser ดึงเองเหมือนเดิม (รอไม่เกิน 2.5 วิ)
export default async function EmployeesRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: [...STAFF_KEY], queryFn: () => usersService.list(STAFF_PARAMS, h) },
          { queryKey: [...ROLES_KEY], queryFn: () => rolesService.list(h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <EmployeesPage />
    </HydrationBoundary>
  );
}
