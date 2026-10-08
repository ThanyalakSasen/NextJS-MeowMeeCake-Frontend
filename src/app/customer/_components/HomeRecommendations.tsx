"use client";
// ─────────────────────────────────────────────────────────────
// ส่วน "สินค้าแนะนำ" หน้าแรก (BACKLOG3-merge C2) · ยกจาก FrontOffice components/customer/HomeRecommendations.tsx
//   login → GET /shop/recommendations (เฉพาะตัว + เหตุผล + ป้ายแพ้อาหาร — U3) · ไม่สำเร็จ = ถอยไป /catalog/products/recommended
//   guest → GET /catalog/products/recommended (เรียงตามคะแนนรีวิว)
// ต่างจากต้นแบบ: ไม่มีผลแนะนำ/โหลดไม่ได้ → แสดงสินค้าพร้อมขายจาก /catalog/products แทน (ต้นแบบขึ้นข้อความ/ปุ่มลองใหม่)
// แสดงเฉพาะที่ซื้อได้ทันที (isProductCardVisible — สต็อก > 0 · ไม่ใช่พรีออเดอร์) สูงสุด 10 ชิ้น
// ─────────────────────────────────────────────────────────────
import { useQuery } from "@tanstack/react-query";
import { catalogService, type SimilarProduct } from "@/services/catalog";
import type { Product } from "@/types/product";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import ProductCard, { isProductCardVisible } from "@/components/customer/ProductCard";
import { homeRecommendationsKey } from "../lib/catalogQueries";

const MAX_ITEMS = 10;

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
  const { status } = useCustomerSession();
  const authed = status === "authenticated";
  const q = useQuery({
    queryKey: [...homeRecommendationsKey, authed],
    queryFn: () => loadRecommendations(authed),
    enabled: status !== "loading",
    staleTime: 5 * 60_000,
  });

  const recs = (q.data ?? []).filter((r) => isProductCardVisible(r.product)).slice(0, MAX_ITEMS);
  const settled = q.isSuccess || q.isError;
  const items: SimilarProduct[] =
    recs.length > 0 ? recs : fallbackProducts.slice(0, MAX_ITEMS).map((product) => ({ product, reasons: [], allergenWarning: null }));
  const loading = !settled || (recs.length === 0 && fallbackLoading);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 pt-12 md:pt-2">
      <div className="flex flex-col items-center justify-center text-center mb-8 md:mb-12">
        <h2 className="!text-3xl md:text-4xl font-extrabold text-[#4A342E] tracking-tight relative inline-block after:content-[''] after:block after:w-16 after:h-1 after:bg-[#8C5A3C] after:mx-auto after:mt-3 after:rounded-full">
          สินค้าแนะนำ
        </h2>
        {authed && recs.length > 0 && <p className="m-0 mt-3 text-sm text-stone-500">เลือกมาสำหรับคุณโดยเฉพาะ</p>}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <p className="text-base sm:text-lg text-[#8C5A3C] font-medium animate-pulse">กำลังสรรหาสินค้าแนะนำ...</p>
        </div>
      ) : items.length > 0 ? (
        // มือถือ 2 · แท็บเล็ต 3 · จอคอม 5 คอลัมน์
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-2">
          {items.map((r) => (
            <ProductCard key={r.product._id} product={r.product} allergenWarning={r.allergenWarning} reasons={r.reasons} />
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center py-16 bg-white/50 rounded-2xl border border-dashed border-[#8C5A3C]/20">
          <p className="text-base sm:text-lg text-gray-500">ขออภัย ยังไม่มีสินค้าในขณะนี้</p>
        </div>
      )}
    </section>
  );
}
