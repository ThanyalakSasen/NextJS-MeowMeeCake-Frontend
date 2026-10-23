import { HydrationBoundary } from "@tanstack/react-query";
import { rolesService } from "@/services/roles";
import { usersService } from "@/services/users";
import { permissionsService } from "@/services/permissions";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import PermissionsPage from "./PermissionsPageClient";
import { PERMISSIONS_KEY, PERMISSIONS_PARAMS, ROLES_KEY, STAFF_KEY, STAFF_PARAMS } from "../employeesQuery";

// สิทธิ์การเข้าถึง — ดึงตำแหน่ง + พนักงาน (นับคนต่อตำแหน่ง) + แถวสิทธิ์ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store)
// ก่อนส่ง HTML · เดิมขึ้นวงหมุนจน JS ทำงาน + รอ API 3 ก้อน (Lighthouse มือถือ Performance 77 · LCP 3.7 วิ) ·
// key ร่วมกับ ViewModel ที่ employeesQuery.ts
export default async function PermissionsRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: [...ROLES_KEY], queryFn: () => rolesService.list(h) },
          { queryKey: [...STAFF_KEY], queryFn: () => usersService.list(STAFF_PARAMS, h) },
          { queryKey: [...PERMISSIONS_KEY], queryFn: () => permissionsService.list(PERMISSIONS_PARAMS, h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <PermissionsPage />
    </HydrationBoundary>
  );
}
