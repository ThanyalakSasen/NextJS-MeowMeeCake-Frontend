import { HydrationBoundary } from "@tanstack/react-query";
import { storeAdminService } from "@/services/storeAdmin";
import { usersService } from "@/services/users";
import { rolesService } from "@/services/roles";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import StoreInfoPage from "./StoreInfoPageClient";
import { MARKETS_KEY, PROFILE_KEY, SETTINGS_KEY } from "./storeInfoQuery";
import { ROLES_KEY, STAFF_KEY, STAFF_PARAMS } from "../employees/employeesQuery";

// ข้อมูลร้าน — ดึงโปรไฟล์ร้าน · ที่อยู่ · ตลาดประจำสัปดาห์ · พนักงาน/ตำแหน่ง (ตัวเลือกเบอร์ร้าน) ฝั่ง server ด้วย cookie ของผู้ใช้
// ก่อนส่ง HTML · เดิมขึ้นวงหมุนจน JS ทำงาน + รอ API · key ร่วมกับ ViewModel
// โปรไฟล์/ที่อยู่/พนักงานเป็นของเจ้าของร้านเท่านั้น — พนักงานได้ 403 → prefetchQuery กลืน error ไม่ส่งไป browser (ViewModel ก็ไม่ดึงอยู่แล้ว)
// ไม่รอ /auth/me มาตัดสินก่อน เพราะจะกลายเป็นรอ backend 2 ทอดต่อกัน
export default async function StoreInfoRoute() {
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: [...PROFILE_KEY], queryFn: () => storeAdminService.profile(h) },
          { queryKey: [...SETTINGS_KEY], queryFn: () => storeAdminService.settings(h) },
          { queryKey: [...MARKETS_KEY], queryFn: () => storeAdminService.weeklyMarkets(h) },
          { queryKey: [...STAFF_KEY], queryFn: () => usersService.list(STAFF_PARAMS, h) },
          { queryKey: [...ROLES_KEY], queryFn: () => rolesService.list(h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <StoreInfoPage />
    </HydrationBoundary>
  );
}
