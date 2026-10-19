import { HydrationBoundary } from "@tanstack/react-query";
import { usersService } from "@/services/users";
import { rolesService } from "@/services/roles";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import EditEmployeePage from "./EditEmployeePageClient";
import { ROLES_KEY, userKey } from "../employeesQuery";

// แก้ไขพนักงาน (?id=) — ดึงข้อมูลพนักงาน + รายการตำแหน่งฝั่ง server ด้วย cookie ของผู้ใช้ แล้วส่งฟอร์มที่กรอกค่าแล้วมาใน
// HTML แรก · เดิมขึ้นวงหมุนจน JS ทำงาน + รอ API (Lighthouse มือถือ Performance 81 · LCP 4.0 วิ) ·
// key ร่วมกับ ViewModel/ฟอร์มที่ employeesQuery.ts
export default async function EditEmployeeRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : "";
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h && id
      ? [
          { queryKey: [...userKey(id)], queryFn: () => usersService.get(id, h) },
          { queryKey: [...ROLES_KEY], queryFn: () => rolesService.list(h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <EditEmployeePage />
    </HydrationBoundary>
  );
}
