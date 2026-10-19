import { HydrationBoundary } from "@tanstack/react-query";
import { userLogsService } from "@/services/userLogs";
import { usersService } from "@/services/users";
import { rolesService } from "@/services/roles";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import UserLogPage from "./UserLogPageClient";
import {
  NO_USER_LOG_FILTERS, ROLES_KEY, STAFF_KEY, STAFF_PARAMS, USER_LOG_PAGE_SIZE,
  userLogCountQueries, userLogPageKey, userLogPageParams, userLogTodayRange,
} from "../employeesQuery";

// บันทึกการทำงานของพนักงาน — ดึงหน้าแรก (10 รายการ) + จำนวนสำหรับการ์ดสถิติ 4 ก้อน (limit 1) + พนักงาน + ตำแหน่ง
// ฝั่ง server ด้วย cookie ของผู้ใช้ — ทุกก้อนยิงรอบเดียว ทันเพดาน 2.5 วิ · เดิมดึงทุกรายการ + ผู้ใช้ทั้งระบบ ไม่ทันเพดาน
// หน้าเลยว่างรอแล้ว browser ดึงซ้ำ (Lighthouse มือถือ SI 5.3 วิ) · key ร่วมกับ ViewModel ที่ employeesQuery.ts
export default async function UserLogRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const pageParams = userLogPageParams(NO_USER_LOG_FILTERS, 1, USER_LOG_PAGE_SIZE);
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: [...userLogPageKey(pageParams)], queryFn: () => userLogsService.list(pageParams, h) },
          ...userLogCountQueries(userLogTodayRange()).map((c) => ({
            queryKey: [...c.key],
            queryFn: () => userLogsService.list(c.params, h),
          })),
          { queryKey: [...STAFF_KEY], queryFn: () => usersService.list(STAFF_PARAMS, h) },
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
