import { HydrationBoundary } from "@tanstack/react-query";
import { ingredientsService } from "@/services/ingredients";
import { ingredientCategoriesService } from "@/services/ingredientCategories";
import { unitsService } from "@/services/units";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import IngredientsPage from "./IngredientsPageClient";
import { INGREDIENTS_KEY, INGREDIENTS_PARAMS, INGREDIENT_CATEGORIES_KEY, UNITS_KEY } from "./ingredientsQuery";

// วัตถุดิบ — ดึงวัตถุดิบ + หมวดหมู่ + หน่วยฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML
// เดิมเนื้อหาขึ้นหลัง JS ทำงาน + รอ API · key ร่วมกับ ViewModel ที่ ingredientsQuery.ts ·
// backend ช้า → browser ดึงเองเหมือนเดิม (รอไม่เกิน 2.5 วิ)
export default async function IngredientsRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: [...INGREDIENTS_KEY], queryFn: () => ingredientsService.list(INGREDIENTS_PARAMS, h) },
          { queryKey: [...INGREDIENT_CATEGORIES_KEY], queryFn: () => ingredientCategoriesService.list(h) },
          { queryKey: [...UNITS_KEY], queryFn: () => unitsService.list({}, h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <IngredientsPage />
    </HydrationBoundary>
  );
}
