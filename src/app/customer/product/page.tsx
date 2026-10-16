import { HydrationBoundary } from "@tanstack/react-query";
import { catalogService } from "@/services/catalog";
import { CATALOG_PRODUCT_PARAMS, catalogCategoriesKey, catalogProductsKey } from "../lib/catalogQueries";
import { prefetchPublic } from "../lib/prefetchPublic";
import ProductListPage from "./_components/ProductListPage";

// สินค้าทั้งหมด — ดึงรายการสินค้า (รูปการ์ดแถวแรก = รูปหลักของหน้า) + หมวดฝั่ง server ก่อน
// ค้นหา (?q=) ใช้ query key คนละชุด → ไม่ prefetch ปล่อยให้ browser ดึงเหมือนเดิม
export default async function ProductListRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = sp.q;
  // search string ส่งให้หน้า client (แทน useSearchParams — ดู ProductListPage)
  const query = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) => (v === undefined ? [] : Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]])),
  ).toString();
  const searching = typeof q === "string" && q.trim() !== "";
  const state = await prefetchPublic([
    ...(searching ? [] : [{ queryKey: catalogProductsKey, queryFn: () => catalogService.products(CATALOG_PRODUCT_PARAMS) }]),
    { queryKey: catalogCategoriesKey, queryFn: catalogService.categories },
  ]);
  return (
    <HydrationBoundary state={state}>
      <ProductListPage query={query} />
    </HydrationBoundary>
  );
}
