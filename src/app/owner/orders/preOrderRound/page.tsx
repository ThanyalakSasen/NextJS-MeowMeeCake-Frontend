import { HydrationBoundary } from "@tanstack/react-query";
import { preordersService } from "@/services/preorders";
import { preorderRoundsService } from "@/services/preorderRounds";
import { LIST_ALL } from "@/lib/http";
import { currentUserOnServer, serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import PreOrderRoundPage from "./PreOrderRoundPageClient";
import { PREORDERS_KEY, ROUND_DASHBOARD_KEY, ROUNDS_KEY, tabFrom } from "./preorderQuery";

// รอบพรีออเดอร์ — ดึงรายการรอบ + พรีออเดอร์ (ViewModel โหลดทั้งสองเสมอ) และสรุปรอบ (ถ้าเปิดแท็บนั้น) ฝั่ง server
// ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML · เดิมตารางขึ้นหลัง JS ทำงานแล้วค่อยยิง API
// key/แท็บร่วมกับ ViewModel ที่ preorderQuery.ts · backend ช้า/ไม่มี user → browser ดึงเองเหมือนเดิม (รอไม่เกิน 2.5 วิ)
export default async function PreOrderRoundRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tab = tabFrom(typeof sp.tab === "string" ? sp.tab : null, typeof sp.id === "string" ? sp.id : null);
  const [user, h] = await Promise.all([currentUserOnServer(), serverHttpAsUser()]);
  const state = await prefetchPublic(
    user && h
      ? [
          { queryKey: [...ROUNDS_KEY], queryFn: () => preorderRoundsService.list({ limit: LIST_ALL }, h) },
          { queryKey: [...PREORDERS_KEY], queryFn: () => preordersService.list({ limit: LIST_ALL }, h) },
          ...(tab === "dashboard"
            ? [{ queryKey: [...ROUND_DASHBOARD_KEY], queryFn: () => preorderRoundsService.dashboard({ limit: LIST_ALL }, h) }]
            : []),
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <PreOrderRoundPage />
    </HydrationBoundary>
  );
}
