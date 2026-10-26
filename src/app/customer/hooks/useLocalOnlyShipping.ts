"use client";
// ─────────────────────────────────────────────────────────────
// สินค้าชิ้นไหน "ส่งได้เฉพาะในจังหวัดร้าน" (เช่น จ.หนองคาย) — ใช้แสดงป้ายบนบัตรสินค้า
// ตรรกะเดียวกับ backend src/lib/shipping.ts (productShipsNationwide + categoryShipsNationwide) ที่ checkout คิดจริง:
//   สินค้าตั้งยกเว้นไว้ (/catalog/shipping-exceptions) → ใช้ค่านั้น · ไม่ตั้ง → ตามหมวด (ships_nationwide / เดาจากชื่อหมวด)
// ข้อมูล 3 ก้อนเป็น API สาธารณะ cache ร่วมกับหน้าค่าจัดส่ง/ติดต่อเรา — ยิงครั้งเดียวทั้งหน้า ไม่ใช่ต่อบัตร
// ยังโหลดไม่เสร็จ = ไม่แสดงป้าย (ไม่เดา)
// ─────────────────────────────────────────────────────────────
import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { catalogService } from "@/services/catalog";
import { storeInfoService } from "@/services/storeInfo";
import { DEFAULT_STORE_PROVINCE, guessShipsNationwide } from "@/constants/shipping";
import { refId } from "@/lib/refId";
import { catalogCategoriesKey, shippingExceptionsKey, storeInfoKey } from "../lib/catalogQueries";

type CategoryRef = string | { _id: string } | null | undefined;

export function useLocalOnlyShipping() {
  const categoriesQ = useQuery({ queryKey: catalogCategoriesKey, queryFn: catalogService.categories, staleTime: 5 * 60_000 });
  const exceptionsQ = useQuery({ queryKey: shippingExceptionsKey, queryFn: storeInfoService.shippingExceptions, staleTime: 5 * 60_000 });
  const infoQ = useQuery({ queryKey: storeInfoKey, queryFn: storeInfoService.get, staleTime: 5 * 60_000 });

  const lookup = useMemo(() => {
    if (!categoriesQ.data || !exceptionsQ.data) return null;
    const nationwideCat = new Map(
      categoriesQ.data.map((c) => [
        c._id,
        typeof c.ships_nationwide === "boolean" ? c.ships_nationwide : guessShipsNationwide(c.product_category_name ?? ""),
      ]),
    );
    return {
      nationwideCat,
      nationwide: new Set(exceptionsQ.data.nationwide.map((p) => p._id)),
      provinceOnly: new Set(exceptionsQ.data.province_only.map((p) => p._id)),
    };
  }, [categoriesQ.data, exceptionsQ.data]);

  /** true = ส่งได้เฉพาะในจังหวัดร้าน · false = ส่งทั่วประเทศ / ยังไม่รู้ */
  const isLocalOnly = useCallback(
    (productId: string, category: CategoryRef): boolean => {
      if (!lookup) return false;
      if (lookup.provinceOnly.has(productId)) return true;
      if (lookup.nationwide.has(productId)) return false;
      const catId = refId(category);
      // ไม่มีหมวด = backend ถือว่าส่งทั่วประเทศไม่ได้ (categoryNationwide = false)
      return !(catId && lookup.nationwideCat.get(catId));
    },
    [lookup],
  );

  const province = infoQ.data?.address?.province?.trim() || DEFAULT_STORE_PROVINCE;
  return { isLocalOnly, province };
}
