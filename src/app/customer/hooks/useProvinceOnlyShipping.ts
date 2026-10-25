"use client";
// ─────────────────────────────────────────────────────────────
// useProvinceOnlyShipping — ป้าย "ส่งเฉพาะ จ.<จังหวัดร้าน>" บนบัตรสินค้า
// คิดแบบเดียวกับ checkout (backend src/lib/shipping.ts productShipsNationwide):
//   สินค้าตั้งยกเว้นไว้ (/catalog/shipping-exceptions) → ใช้ค่านั้น · ไม่ได้ตั้ง → ตามหมวด (/catalog/categories)
// ใช้ cache ร่วมกับหน้า "การจัดส่ง" · โหลดไม่สำเร็จ = ไม่แสดงป้าย (ไม่เดา)
// ─────────────────────────────────────────────────────────────
import { useQuery } from "@tanstack/react-query";
import { catalogService } from "@/services/catalog";
import { storeInfoService } from "@/services/storeInfo";
import { refId } from "@/lib/refId";
import { guessShipsNationwide } from "@/constants/shipping";
import type { Product } from "@/types/product";
import { catalogCategoriesKey, shippingExceptionsKey, storeInfoKey } from "../lib/catalogQueries";

export function useProvinceOnlyShipping() {
  const catsQ = useQuery({ queryKey: catalogCategoriesKey, queryFn: catalogService.categories, staleTime: 5 * 60_000 });
  const exQ = useQuery({ queryKey: shippingExceptionsKey, queryFn: storeInfoService.shippingExceptions, staleTime: 5 * 60_000 });
  const infoQ = useQuery({ queryKey: storeInfoKey, queryFn: storeInfoService.get, staleTime: 5 * 60_000 });

  const cats = catsQ.data;
  const exceptions = exQ.data;
  // React Compiler memoize ให้เอง (ไม่ใช้ useMemo — lint preserve-manual-memoization)
  const isProvinceOnly = (() => {
    if (!cats || !exceptions) return () => false;
    const catNationwide = new Map(
      cats.map((c) => [c._id, typeof c.ships_nationwide === "boolean" ? c.ships_nationwide : guessShipsNationwide(c.product_category_name)]),
    );
    const forcedNationwide = new Set(exceptions.nationwide.map((p) => p._id));
    const forcedLocal = new Set(exceptions.province_only.map((p) => p._id));
    return (p: { _id: string; category_id?: Product["category_id"] | null }): boolean => {
      if (forcedLocal.has(p._id)) return true;
      if (forcedNationwide.has(p._id)) return false;
      const catId = refId(p.category_id);
      // ไม่รู้หมวด = backend ถือว่าส่งเฉพาะจังหวัด (catNationwide = false)
      return !(catId && catNationwide.get(catId));
    };
  })();

  return { isProvinceOnly, province: infoQ.data?.address.province.trim() ?? "" };
}
