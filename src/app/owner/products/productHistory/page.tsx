import { HydrationBoundary } from "@tanstack/react-query";
import { productsService } from "@/services/products";
import { serverHttpAsUser } from "@/lib/serverAuth";
import { prefetchPublic } from "@/app/customer/lib/prefetchPublic";
import ProductHistoryPage from "./ProductHistoryPageClient";
import { STOCK_LIST_KEY, STOCK_PARAMS } from "../productStock/stockQuery";
import { DEFAULT_HISTORY_FILTERS, HISTORY_PAGE_SIZE, historyKey, historyParams } from "./historyQuery";

// ประวัติสต็อกสินค้า (?product= = เปิดมาจากปุ่มประวัติของสินค้านั้นในหน้าสต็อก) — ดึงหน้าแรก + รายชื่อสินค้า (ตัวกรอง)
// ฝั่ง server ด้วย cookie ของผู้ใช้ (no-store) ก่อนส่ง HTML · key ร่วมกับ ViewModel ที่ historyQuery.ts / stockQuery.ts
export default async function ProductHistoryRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const productId = typeof sp.product === "string" && sp.product ? sp.product : "all";
  const params = historyParams({ ...DEFAULT_HISTORY_FILTERS, productId }, 1, HISTORY_PAGE_SIZE);
  // ไม่รอ /auth/me ก่อน — ยิงข้อมูลพร้อมกับที่ layout ถาม /auth/me · ดู serverHttpAsUser
  const h = await serverHttpAsUser();
  const state = await prefetchPublic(
    h
      ? [
          { queryKey: [...historyKey(params)], queryFn: () => productsService.stockHistory(params, h) },
          { queryKey: [...STOCK_LIST_KEY], queryFn: () => productsService.stockList(STOCK_PARAMS, h) },
        ]
      : [],
  );
  return (
    <HydrationBoundary state={state}>
      {/* key — เปลี่ยน ?product= ระหว่างอยู่หน้านี้ = เริ่มตัวกรองใหม่ */}
      <ProductHistoryPage key={productId} productId={productId} />
    </HydrationBoundary>
  );
}
