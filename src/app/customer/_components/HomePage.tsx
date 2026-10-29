"use client";
// ─────────────────────────────────────────────────────────────
// หน้าแรกของหน้าร้าน — ย้ายมาจาก FrontOffice (customer/page.tsx)
// เปลี่ยนจากเดิม: ข้อมูลจาก /catalog/products (สินค้าปกติ ?is_preorder=false) + /catalog/categories ผ่าน react-query
// สินค้าแนะนำ: _components/HomeRecommendations (C2 — login = เฉพาะตัว · guest = คะแนนรีวิว · ไม่มีผล = สินค้าพร้อมขาย)
// สินค้าขายดี: _components/HomeBestSellers (เรียงตามจำนวนรีวิว — ยังไม่มียอดขายสาธารณะ) · ทั้งสองส่วนสูงสุด 10 ชิ้น
// แสดงเฉพาะสินค้าพร้อมขาย: สต็อก > 0 และไม่ใช่พรีออเดอร์ (เกณฑ์เดียวกับหน้าสินค้าทั้งหมด — isProductCardVisible)
// ─────────────────────────────────────────────────────────────
import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { catalogService } from "@/services/catalog";
import HeroCarousel from "@/components/customer/HeroCarousel";
import { categoryNameOf, isProductCardVisible } from "@/components/customer/ProductCard";
import HomeRecommendations from "./HomeRecommendations";
import HomeBestSellers from "./HomeBestSellers";
import { CATALOG_PRODUCT_PARAMS, catalogCategoriesKey, catalogProductsKey } from "../lib/catalogQueries";
import { thaiCompare } from "@/lib/thaiSort";

/** หมวดที่แสดงในหน้าแรก — รวมปุ่ม "ทั้งหมด" อีก 1 = 6 ช่อง (ครบ 1 แถวบนจอคอม) */
const MAX_HOME_CATEGORIES = 5;
/** จอกลาง (768–1279px) — "ทั้งหมด" + 3 = 4 ช่อง (ครบ 1 แถว) · หมวดลำดับถัดไปซ่อนเฉพาะช่วงนี้ */
const MAX_HOME_CATEGORIES_MD = 3;


export default function CustomerHomePage() {
  const t = useTranslations("shop");
  const productsQ = useQuery({
    queryKey: catalogProductsKey,
    queryFn: () => catalogService.products(CATALOG_PRODUCT_PARAMS),
  });
  const categoriesQ = useQuery({ queryKey: catalogCategoriesKey, queryFn: catalogService.categories });

  const products = useMemo(() => (productsQ.data?.data ?? []).filter((p) => isProductCardVisible(p)), [productsQ.data]);

  // หมวดที่มีสินค้าพร้อมขาย — สินค้ามากสุดก่อน · เท่ากัน = ก-ฮ (ซ่อนหมวดที่ไม่มีสินค้า)
  const categoryCards = useMemo(() => {
    return (categoriesQ.data ?? [])
      .map((c) => {
        const name = c.product_category_name?.trim();
        const productCount = name ? products.filter((p) => categoryNameOf(p) === name).length : 0;
        return { id: c._id, name: name ?? "", productCount };
      })
      .filter((c) => c.name && c.productCount > 0)
      .sort((a, b) => b.productCount - a.productCount || thaiCompare(a.name, b.name));
  }, [categoriesQ.data, products]);

  // isPending ไม่ใช่ isLoading — ตอน render ฝั่ง server isLoading = false (ยังไม่ fetch) HTML แรกจึงเป็นสถานะ "ไม่มีข้อมูล"
  // แล้วสลับเป็นกำลังโหลด → ข้อมูลจริง = หน้ากระโดด (Lighthouse CLS)
  const loading = productsQ.isPending;

  return (
    <div className="w-full min-h-screen text-[#4A342E] pt-28 sm:pt-32 md:pt-36">
      <HeroCarousel />

      <section className="w-full max-w-[1200px] mx-auto px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px] pb-12">
        <div className="mt-6 pt-6">
          <div className="mb-4">
            {/* h2 — การ์ดหมวดเป็น h3 (Lighthouse heading-order) */}
            <h2 className="m-0 inline-block !text-base font-bold tracking-wider uppercase bg-[#8C5A3C]/10 text-[#8C5A3C] px-3.5 py-1 rounded-full">
              {t("home.allCategories")}
            </h2>
          </div>

          {/* รอสินค้าโหลดด้วย เพราะต้องใช้จำนวนสินค้าในการซ่อน/เรียงหมวด */}
          {categoriesQ.isPending || loading ? (
            <p className="text-center py-6 text-[#8C5A3C] !text-base">{t("home.loadingCategories")}</p>
          ) : categoryCards.length > 0 ? (
            // "ทั้งหมด" + หมวด: มือถือ/sm สูงสุด 5 (3 · 4 ต่อแถว) · จอกลาง 768–1279 สูงสุด 3 (4 ต่อแถว) · จอคอม ≥1280 สูงสุด 5 (6 ต่อแถว)
            // flex-wrap + justify-center: ไม่ครบแถว (ช่องน้อยกว่าที่แถวรับได้ / แถวสุดท้าย) จัดกึ่งกลาง · ความกว้างช่องเท่าตาราง (หัก gap)
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3.5">
              {[
                { id: "all", name: t("home.allFilter"), href: "/customer/product", mdHidden: false },
                ...categoryCards.slice(0, MAX_HOME_CATEGORIES).map((c, i) => ({
                  id: c.id,
                  name: c.name,
                  href: `/customer/product?category=${encodeURIComponent(c.name)}`,
                  mdHidden: i >= MAX_HOME_CATEGORIES_MD,
                })),
              ].map((c) => (
                <Link
                  key={c.id}
                  href={c.href}
                  className={`group block w-[calc((100%-1.25rem)/3)] sm:w-[calc((100%-2.625rem)/4)] xl:w-[calc((100%-4.375rem)/6)] ${
                    c.mdHidden ? "md:max-xl:hidden" : ""
                  }`}
                >
                  <div className="w-full h-[44px] bg-white hover:bg-[#4A342E] border border-[#8C5A3C]/15 rounded-lg px-2 flex items-center justify-center text-center shadow-sm hover:shadow-md transition-all duration-200">
                    <h3 className="text-sm font-semibold text-[#4A342E] group-hover:text-white transition-colors line-clamp-1">
                      {c.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center py-6 text-sm text-gray-500">{t("home.noCategories")}</p>
          )}
        </div>
      </section>

      <HomeRecommendations fallbackProducts={products} fallbackLoading={loading} />

      <HomeBestSellers products={products} loading={loading} />

      <section className="w-full max-w-[1200px] mx-auto px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px] pb-12">
        <div className="flex justify-center mt-10 md:mt-12">
          <Link
            href="/customer/product"
            className="inline-flex items-center justify-center gap-2 text-sm h-[44px] px-8 group bg-white border border-[#8C5A3C]/30 !text-[#4A342E] font-bold rounded-xl shadow-md shadow-[#4A342E]/20 hover:!bg-[#4A342E] hover:!text-white hover:shadow-lg active:scale-[0.98] transition-all duration-200"
          >
            <span>{t("common.allProducts")}</span>
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
