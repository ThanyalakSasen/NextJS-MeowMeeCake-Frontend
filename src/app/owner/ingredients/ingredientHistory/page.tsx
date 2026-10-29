import { HydrationBoundary } from "@tanstack/react-query";
import { ingredientsService } from "@/services/ingredients";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import IngredientHistoryPage from "./IngredientHistoryPageClient";
import { INGREDIENTS_KEY, INGREDIENTS_PARAMS, INGREDIENT_TXNS_KEY, fetchIngredientTxns } from "../ingredientsQuery";

// ประวัติวัตถุดิบ — ดึงรายการเคลื่อนไหว + วัตถุดิบ (ชื่อ/หน่วย) ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมเนื้อหาขึ้นหลัง JS ทำงาน + รอ API · key ร่วมกับ ViewModel ที่ ingredientsQuery.ts
export default async function IngredientHistoryRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: [...INGREDIENT_TXNS_KEY], queryFn: () => fetchIngredientTxns(h) },
          { queryKey: [...INGREDIENTS_KEY], queryFn: () => ingredientsService.list(INGREDIENTS_PARAMS, h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <IngredientHistoryPage />
    </HydrationBoundary>
  );
}
