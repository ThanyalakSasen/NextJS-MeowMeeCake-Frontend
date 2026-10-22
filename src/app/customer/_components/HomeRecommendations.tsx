"use client";
// ─────────────────────────────────────────────────────────────
// ส่วน "สินค้าแนะนำ" หน้าแรก (BACKLOG3-merge C2) · ยกจาก FrontOffice components/customer/HomeRecommendations.tsx
//   login → GET /shop/recommendations (เฉพาะตัว + เหตุผล — U3) · ไม่สำเร็จ = ถอยไป /catalog/products/recommended
//   สินค้าที่มีวัตถุดิบที่ลูกค้าแพ้ไม่ถูกแนะนำ (backend ตัดให้ · รายการสำรองด้านล่างกรองด้วย useAllergenWarnings)
//   guest → GET /catalog/products/recommended (เรียงตามคะแนนรีวิว)
// ต่างจากต้นแบบ: ไม่มีผลแนะนำ/โหลดไม่ได้ → แสดงสินค้าพร้อมขายจาก /catalog/products แทน (ต้นแบบขึ้นข้อความ/ปุ่มลองใหม่)
// แสดงเฉพาะที่ซื้อได้ทันที (isProductCardVisible — สต็อก > 0 · ไม่ใช่พรีออเดอร์) สูงสุด 10 ชิ้น
// ─────────────────────────────────────────────────────────────
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { catalogService, type SimilarProduct } from "@/services/catalog";
import type { Product } from "@/types/product";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import ProductCard, { isProductCardVisible } from "@/components/customer/ProductCard";
import { homeRecommendationsKey } from "../lib/catalogQueries";
import { useAllergenWarnings } from "../hooks/useAllergenWarnings";
import { PRODUCT_GRID, PRODUCT_SECTION } from "../lib/productGrid";

const MAX_ITEMS = 10;

/**
 * จำนวนการ์ดที่แสดงต่อขนาดจอ — ให้แสดงเป็นแถวเต็ม ไม่มีแถวสุดท้ายแหว่ง
 *   มือถือ (<640 · 2 คอลัมน์)   : ≥6 → 6 (3 แถว) · 4–5 → 4 (2 แถว)
 *   จอกลาง (640–1279 · 3 คอลัมน์): ≥6 → 6 (2 แถว) · 3–5 → 3 (1 แถว)
 *   จอใหญ่ (≥1280 · 5 คอลัมน์)   : ≥10 → 10 (2 แถว) · 5–9 → 5 (1 แถว)
 *   น้อยกว่าขั้นต่ำสุด = แสดงทั้งหมด
 */
const VISIBLE_TIERS = { base: [6, 4], sm: [6, 3], xl: [10, 5] } as const;

function visibleCount(total: number, tiers: readonly number[]): number {
  return tiers.find((t) => total >= t) ?? total;
}

/** class ซ่อน/แสดงการ์ดลำดับที่ i ตามขนาดจอ (`contents` = การ์ดยังเป็น grid item ตรง ๆ) */
function visibilityClass(i: number, total: number): string {
  return [
    i < visibleCount(total, VISIBLE_TIERS.base) ? "contents" : "hidden",
    i < visibleCount(total, VISIBLE_TIERS.sm) ? "sm:contents" : "sm:hidden",
    i < visibleCount(total, VISIBLE_TIERS.xl) ? "xl:contents" : "xl:hidden",
  ].join(" ");
}

async function loadRecommendations(authed: boolean): Promise<SimilarProduct[]> {
  if (!authed) return catalogService.recommended();
  try {
    return await catalogService.recommendedForMe(MAX_ITEMS);
  } catch {
    return catalogService.recommended();
  }
}

export default function HomeRecommendations({ fallbackProducts, fallbackLoading }: {
  /** สินค้าพร้อมขายของหน้าแรก (กรองแล้ว) — ใช้เมื่อไม่มีผลแนะนำ */
  fallbackProducts: Product[];
  fallbackLoading: boolean;
}) {
  const t = useTranslations("shop.home");
  const { status } = useCustomerSession();
  const authed = status === "authenticated";
  const allergenWarningOf = useAllergenWarnings();
  const q = useQuery({
    queryKey: [...homeRecommendationsKey, authed],
    queryFn: () => loadRecommendations(authed),
    enabled: status !== "loading",
    staleTime: 5 * 60_000,
  });

  const recs = (q.data ?? []).filter((r) => isProductCardVisible(r.product)).slice(0, MAX_ITEMS);
  const settled = q.isSuccess || q.isError;
  const items: SimilarProduct[] =
    recs.length > 0
      ? recs
      : fallbackProducts
          .filter((product) => !allergenWarningOf(product._id))
          .slice(0, MAX_ITEMS)
          .map((product) => ({ product, reasons: [], allergenWarning: null }));
  const loading = !settled || (recs.length === 0 && fallbackLoading);

  // ระยะเหนือหัวข้อ = pb-12 ของส่วนหมวดหมู่ (54px) + pt ตรงนี้ → 54 / 72px (≥768) เท่าช่วงสินค้าแนะนำ → สินค้าขายดี (HomeBestSellers pt-12 md:pt-16)
  return (
    <section className={`${PRODUCT_SECTION} md:pt-4`}>
      <div className="flex flex-col items-center justify-center text-center mb-8 md:mb-12">
        <h2 className="!text-2xl md:!text-3xl xl:!text-4xl font-extrabold text-[#4A342E] tracking-tight relative inline-block after:content-[''] after:block after:w-16 after:h-1 after:bg-[#8C5A3C] after:mx-auto after:mt-3 after:rounded-full">
          {t("recommended")}
        </h2>
        {authed && recs.length > 0 && <p className="m-0 mt-3 text-sm text-stone-500">{t("forYou")}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <p className="text-base sm:text-lg text-[#8C5A3C] font-medium animate-pulse">{t("loadingRecs")}</p>
        </div>
      ) : items.length > 0 ? (
        // มือถือ (<640) 2 · 640–1279 3 · จอคอม (≥1280) 5 คอลัมน์
        <div className={PRODUCT_GRID}>
          {items.map((r, i) => (
            <div key={r.product._id} className={visibilityClass(i, items.length)}>
              <ProductCard product={r.product} allergenWarning={r.allergenWarning} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center py-16 bg-white/50 rounded-2xl border border-dashed border-[#8C5A3C]/20">
          <p className="text-base sm:text-lg text-gray-500">{t("noProducts")}</p>
        </div>
      )}
    </section>
  );
}
