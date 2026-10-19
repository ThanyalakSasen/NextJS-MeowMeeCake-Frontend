import { HydrationBoundary } from "@tanstack/react-query";
import { userLogsService } from "@/services/userLogs";
import { usersService } from "@/services/users";
import { rolesService } from "@/services/roles";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import UserLogPage from "./UserLogPageClient";
import { ALL_USERS_KEY, ALL_USERS_PARAMS, ROLES_KEY, USER_LOGS_KEY, USER_LOGS_PARAMS } from "../employeesQuery";

// บันทึกการทำงานของพนักงาน — ดึงบันทึก + ผู้ใช้ + ตำแหน่ง (เติมชื่อ/ตำแหน่งผู้ทำรายการ) ฝั่ง server ด้วย cookie ของผู้ใช้
// ก่อนส่ง HTML · เดิมการ์ดสถิติขึ้น 0 จน JS ทำงาน + รอ API 3 ก้อน (Lighthouse มือถือ Performance 83 · LCP 4.0 วิ) ·
// key ร่วมกับ ViewModel ที่ employeesQuery.ts
export default async function UserLogRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: [...USER_LOGS_KEY], queryFn: () => userLogsService.list(USER_LOGS_PARAMS, h) },
          { queryKey: [...ALL_USERS_KEY], queryFn: () => usersService.list(ALL_USERS_PARAMS, h) },
          { queryKey: [...ROLES_KEY], queryFn: () => rolesService.list(h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <UserLogPage />
    </HydrationBoundary>
  );
}
