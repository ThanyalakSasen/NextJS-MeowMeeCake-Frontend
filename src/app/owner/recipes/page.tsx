import { HydrationBoundary } from "@tanstack/react-query";
import { recipesService } from "@/services/recipes";
import { recipeComponentsService } from "@/services/recipeComponents";
import { componentCategoriesService } from "@/services/componentCategories";
import { productsService } from "@/services/products";
import { productCategoriesService } from "@/services/productCategories";
import { unitsService } from "@/services/units";
import { ingredientsService } from "@/services/ingredients";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import RecipesPage from "./RecipesPageClient";
import { RECIPES_QUERIES as Q } from "./recipesQuery";

// สูตร — ดึง 7 ก้อนที่ประกอบหน้า (สูตร · ส่วนประกอบ · หมวดส่วนประกอบ · สินค้า · หมวดสินค้า · หน่วย · วัตถุดิบ) ฝั่ง server
// พร้อมกันด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML · เดิมเนื้อหาขึ้นหลัง JS ทำงาน แล้วข้อมูลทยอยมาทีละก้อน
// (Lighthouse มือถือ Performance 66 · LCP 4.6 วิ · TBT 530ms · CLS 0.118) · key ร่วมกับ ViewModel ที่ recipesQuery.ts
export default async function RecipesRoute() {
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: [...Q.recipes.key], queryFn: () => recipesService.list(Q.recipes.params, h) },
          { queryKey: [...Q.components.key], queryFn: () => recipeComponentsService.list(Q.components.params, h) },
          { queryKey: [...Q.componentCategories.key], queryFn: () => componentCategoriesService.list(h) },
          { queryKey: [...Q.products.key], queryFn: () => productsService.list(Q.products.params, h) },
          { queryKey: [...Q.productCategories.key], queryFn: () => productCategoriesService.list(h) },
          { queryKey: [...Q.units.key], queryFn: () => unitsService.list({}, h) },
          { queryKey: [...Q.ingredients.key], queryFn: () => ingredientsService.list(Q.ingredients.params, h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      <RecipesPage />
    </HydrationBoundary>
  );
}
