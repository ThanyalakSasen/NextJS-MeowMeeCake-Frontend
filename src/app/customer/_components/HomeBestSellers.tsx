"use client";
// ─────────────────────────────────────────────────────────────
// ส่วน "สินค้าขายดี" หน้าแรก — ต่อจากสินค้าแนะนำ
// backend ยังไม่มียอดขายแบบสาธารณะ (ยอดจริงอยู่ที่ /admin/dashboard/top-products ต้องเป็นพนักงาน)
// → เรียงตามจำนวนรีวิว (review_count — รีวิวได้เฉพาะคนที่ซื้อแล้ว) แล้วคะแนนเฉลี่ย · ไม่มีรีวิวเลย = ไม่นับ
// ถ้า backend เพิ่ม endpoint สินค้าขายดีภายหลัง เปลี่ยนแค่ bestSellersOf() เป็นข้อมูลจากตัวนั้น
// ใช้สินค้าพร้อมขายชุดเดียวกับหน้าแรก (กรอง isProductCardVisible แล้ว) สูงสุด 10 ชิ้น · ไม่มีเลย = ซ่อนทั้งส่วน
// ─────────────────────────────────────────────────────────────
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { Product } from "@/types/product";
import ProductCard from "@/components/customer/ProductCard";

const MAX_ITEMS = 10;

function bestSellersOf(products: Product[]): Product[] {
  return products
    .filter((p) => (p.review_count ?? 0) > 0)
    .sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0) || (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
    .slice(0, MAX_ITEMS);
}

export default function HomeBestSellers({ products, loading }: {
  /** สินค้าพร้อมขายของหน้าแรก (กรองแล้ว) */
  products: Product[];
  loading: boolean;
}) {
  const t = useTranslations("shop.home");
  const items = useMemo(() => bestSellersOf(products), [products]);

  if (loading || items.length === 0) return null;

  return (
    <section className="w-full max-w-[1200px] mx-auto px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px] pt-12 md:pt-16">
      <div className="flex flex-col items-center justify-center text-center mb-8 md:mb-12">
        <h2 className="!text-2xl md:!text-3xl xl:!text-4xl font-extrabold text-[#4A342E] tracking-tight relative inline-block after:content-[''] after:block after:w-16 after:h-1 after:bg-[#8C5A3C] after:mx-auto after:mt-3 after:rounded-full">
          {t("bestSellers")}
        </h2>
      </div>

      {/* มือถือ (<640) 2 · 640–1279 3 · จอคอม (≥1280) 5 คอลัมน์ — เท่าสินค้าแนะนำ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-2">
        {items.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}
