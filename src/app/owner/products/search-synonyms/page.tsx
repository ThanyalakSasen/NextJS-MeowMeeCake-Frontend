import { HydrationBoundary } from "@tanstack/react-query";
import { searchSynonymsService } from "@/services/searchSynonyms";
import { currentUserOnServer, serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import SearchSynonymsPage from "./SearchSynonymsPageClient";
import { SYNONYMS_KEY } from "./synonymsQuery";

// คำพ้องค้นหา — ดึงกลุ่มคำฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมทั้งหน้า (รวมคำอธิบายด้านบน = LCP) เป็นวงหมุนจนกว่า JS ทำงาน + API ตอบ (Lighthouse มือถือ LCP 3.8 วิ)
// key ร่วมกับ ViewModel ที่ synonymsQuery.ts · backend ช้า/ไม่มี user → browser ดึงเองเหมือนเดิม (รอไม่เกิน 2.5 วิ)
export default async function SearchSynonymsRoute() {
  const [user, h] = await Promise.all([currentUserOnServer(), serverHttpAsUser()]);
  const state = await prefetchPublic(
    user && h ? [{ queryKey: [...SYNONYMS_KEY], queryFn: () => searchSynonymsService.list(h) }] : [],
  );
  return (
    <HydrationBoundary state={state}>
      <SearchSynonymsPage />
    </HydrationBoundary>
  );
}
