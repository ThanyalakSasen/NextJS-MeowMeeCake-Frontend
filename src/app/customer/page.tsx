"use client";
// ─────────────────────────────────────────────────────────────
// หน้าแรกของหน้าร้าน — ย้ายมาจาก FrontOffice (customer/page.tsx)
// เปลี่ยนจากเดิม: ข้อมูลจาก /catalog/products (สินค้าปกติ ?is_preorder=false) + /catalog/categories ผ่าน react-query
// สินค้าแนะนำ: _components/HomeRecommendations (C2 — login = เฉพาะตัว · guest = คะแนนรีวิว · ไม่มีผล = สินค้าพร้อมขาย)
// แสดงเฉพาะสินค้าพร้อมขาย: สต็อก > 0 และไม่ใช่พรีออเดอร์ (เกณฑ์เดียวกับหน้าสินค้าทั้งหมด — isProductCardVisible)
// ─────────────────────────────────────────────────────────────
import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { catalogService } from "@/services/catalog";
import HeroCarousel from "@/components/customer/HeroCarousel";
import { categoryNameOf, isProductCardVisible } from "@/components/customer/ProductCard";
import HomeRecommendations from "./_components/HomeRecommendations";
import { CATALOG_PRODUCT_PARAMS, catalogCategoriesKey, catalogProductsKey } from "./lib/catalogQueries";


export default function CustomerHomePage() {
  const t = useTranslations("shop");
  const productsQ = useQuery({
    queryKey: catalogProductsKey,
    queryFn: () => catalogService.products(CATALOG_PRODUCT_PARAMS),
  });
  const categoriesQ = useQuery({ queryKey: catalogCategoriesKey, queryFn: catalogService.categories });

  const products = useMemo(() => (productsQ.data?.data ?? []).filter(isProductCardVisible), [productsQ.data]);

  // หมวดที่มีสินค้าพร้อมขาย เรียงจากจำนวนสินค้ามากไปน้อย (ซ่อนหมวดที่ไม่มีสินค้า)
  const categoryCards = useMemo(() => {
    return (categoriesQ.data ?? [])
      .map((c) => {
        const name = c.product_category_name?.trim();
        const productCount = name ? products.filter((p) => categoryNameOf(p) === name).length : 0;
        return { id: c._id, name: name ?? "", productCount };
      })
      .filter((c) => c.name && c.productCount > 0)
      .sort((a, b) => b.productCount - a.productCount);
  }, [categoriesQ.data, products]);

  const loading = productsQ.isLoading;

  return (
    <div className="w-full min-h-screen text-[#4A342E] pt-28 sm:pt-32 md:pt-36">
      <HeroCarousel />

      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mt-6 pt-6">
          <div className="mb-4">
            <span className="inline-block !text-base font-bold tracking-wider uppercase bg-[#8C5A3C]/10 text-[#8C5A3C] px-3.5 py-1 rounded-full">
              {t("home.allCategories")}
            </span>
          </div>

          {/* รอสินค้าโหลดด้วย เพราะต้องใช้จำนวนสินค้าในการซ่อน/เรียงหมวด */}
          {categoriesQ.isLoading || loading ? (
            <p className="text-center py-6 text-[#8C5A3C] animate-pulse !text-base">{t("home.loadingCategories")}</p>
          ) : categoryCards.length > 0 ? (
            // มือถือ 3 · แท็บเล็ต 4 · จอคอม 6 คอลัมน์ — แสดงสูงสุด 12 หมวด
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
              {categoryCards.slice(0, 12).map((c) => (
                <Link
                  key={c.id}
                  href={`/customer/product?category=${encodeURIComponent(c.name)}`}
                  className="group block w-full"
                >
                  <div className="w-full h-11 sm:h-12 bg-white hover:bg-[#4A342E] border border-[#8C5A3C]/15 rounded-lg px-2 flex items-center justify-center text-center shadow-sm hover:shadow-md transition-all duration-200">
                    <h3 className="text-xs sm:text-sm font-semibold text-[#4A342E] group-hover:text-white transition-colors line-clamp-1">
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

      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 pb-12">
        <div className="flex justify-center mt-10 md:mt-12">
          <Link
            href="/customer/product"
            className="inline-flex items-center justify-center gap-2 text-sm sm:text-base px-8 py-3.5 group bg-white border border-[#8C5A3C]/30 !text-[#4A342E] font-bold rounded-xl shadow-md shadow-[#4A342E]/20 hover:!bg-[#4A342E] hover:!text-white hover:shadow-lg active:scale-[0.98] transition-all duration-200"
          >
            <span>{t("common.allProducts")}</span>
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
