import { HydrationBoundary } from "@tanstack/react-query";
import { catalogService } from "@/services/catalog";
import { CATALOG_PRODUCT_PARAMS, catalogBannersKey, catalogCategoriesKey, catalogProductsKey } from "./lib/catalogQueries";
import { prefetchPublic } from "./lib/prefetchPublic";
import CustomerHomePage from "./_components/HomePage";

// หน้าแรก — ดึงแบนเนอร์ (รูปหลักของหน้า) + สินค้า/หมวดฝั่ง server ก่อน (src/app/customer/lib/prefetchPublic.ts)
export default async function HomeRoute() {
  const state = await prefetchPublic([
    { queryKey: catalogBannersKey, queryFn: catalogService.banners },
    { queryKey: catalogProductsKey, queryFn: () => catalogService.products(CATALOG_PRODUCT_PARAMS) },
    { queryKey: catalogCategoriesKey, queryFn: catalogService.categories },
  ]);
  return (
    <HydrationBoundary state={state}>
      <CustomerHomePage />
    </HydrationBoundary>
  );
}
