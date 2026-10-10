"use client";
// ─────────────────────────────────────────────────────────────
// สินค้าทั้งหมด — ย้ายมาจาก FrontOffice (customer/product/page.tsx)
// เปลี่ยนจากเดิม: ข้อมูลจาก /catalog/products + /catalog/categories (cache ร่วมกับหน้าแรก) · หมวดจาก ?category=<ชื่อหมวด>
// · ค้นหา ?q= ที่ server (/catalog/products?search= — backend ขยายคำพ้องให้ · BACKLOG4 U4 / H6) แทนการกรองในหน้า
//   ซึ่งหาคำพ้องไม่เจอ · จำนวนในหมวดนับจากผลค้นหา (เห็นว่าผลอยู่หมวดไหน)
// · เรียงตามเก็บใน ?sort= (กลับจากหน้าสินค้าแล้วยังเรียงแบบเดิม)
// ต่างจากต้นแบบ: "ขายดี" → "คะแนนรีวิวสูงสุด" (catalog ไม่ส่งยอดขายมา · avg_rating มี)
// ─────────────────────────────────────────────────────────────
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FaFilter, FaSortAmountDown } from "react-icons/fa";
import { catalogService } from "@/services/catalog";
import { effectivePrice } from "@/lib/pricing";
import ProductCard, { categoryNameOf, isProductCardVisible } from "@/components/customer/ProductCard";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { CATALOG_PRODUCT_PARAMS, catalogCategoriesKey, catalogProductsKey } from "../lib/catalogQueries";

/** หมวด "ทั้งหมด" — ค่าภายใน (ชื่อที่แสดงมาจาก i18n) */
const ALL = "__all__";
type SortKey = "latest" | "rating" | "price-asc" | "price-desc";
const SORTS: SortKey[] = ["latest", "rating", "price-asc", "price-desc"];
const isSortKey = (v: string | null): v is SortKey => SORTS.some((s) => s === v);

// ใช้ useSearchParams จึงต้องครอบด้วย Suspense (ไม่งั้น next build จะ error)
export default function ProductListPage() {
  return (
    <Suspense fallback={null}>
      <ProductListContent />
    </Suspense>
  );
}

function ProductListContent() {
  const t = useTranslations("shop.products");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentCategory = searchParams.get("category") || ALL;
  const searchQuery = searchParams.get("q")?.trim() || "";
  const sortParam = searchParams.get("sort");
  const sortBy: SortKey = isSortKey(sortParam) ? sortParam : "latest";
  const setSortBy = (key: SortKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "latest") params.delete("sort");
    else params.set("sort", key);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  // ไม่ค้นหา = รายการเต็ม (cache ร่วมกับหน้าแรก) · ค้นหา = ถาม server (ขยายคำพ้อง)
  const productsQ = useQuery({
    queryKey: searchQuery ? [...catalogProductsKey, "search", searchQuery] : catalogProductsKey,
    queryFn: () => catalogService.products(searchQuery ? { ...CATALOG_PRODUCT_PARAMS, search: searchQuery } : CATALOG_PRODUCT_PARAMS),
    placeholderData: keepPreviousData,
  });
  const categoriesQ = useQuery({ queryKey: catalogCategoriesKey, queryFn: catalogService.categories });
  const loading = productsQ.isLoading;

  // กรองสินค้าที่บัตรไม่แสดง (พรีออเดอร์ / หมดสต็อก / ซ่อน) ออกตั้งแต่ต้น — ตัวเลขจำนวนในหมวดจะได้ตรงกับบัตรที่เห็นจริง
  const products = useMemo(() => (productsQ.data?.data ?? []).filter(isProductCardVisible), [productsQ.data]);

  // หมวดพร้อมจำนวนสินค้า — ซ่อนหมวดที่ไม่มีสินค้า เรียงจากมากไปน้อย ("ทั้งหมด" อยู่บนสุดเสมอ)
  const categoryCards = useMemo(() => {
    const names = (categoriesQ.data ?? []).map((c) => c.product_category_name?.trim()).filter((n): n is string => !!n);
    const counted = names
      .map((name) => ({ name, count: products.filter((p) => categoryNameOf(p) === name).length }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);
    return [{ name: ALL, count: products.length }, ...counted];
  }, [categoriesQ.data, products]);

  const visible = useMemo(() => {
    // คำค้นกรองที่ server แล้ว (productsQ) — ที่นี่เหลือแค่หมวด + เรียง
    let result = [...products];
    if (currentCategory !== ALL) result = result.filter((p) => categoryNameOf(p) === currentCategory);
    result.sort((a, b) => {
      // เรียงตามราคาขายจริง (ราคาลดถ้ามี) ให้ตรงกับราคาที่แสดงบนบัตร
      if (sortBy === "price-asc") return effectivePrice(a) - effectivePrice(b);
      if (sortBy === "price-desc") return effectivePrice(b) - effectivePrice(a);
      if (sortBy === "rating") {
        const r = Number(b.avg_rating ?? 0) - Number(a.avg_rating ?? 0);
        return r !== 0 ? r : (b.review_count ?? 0) - (a.review_count ?? 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return result;
  }, [products, currentCategory, sortBy]);

  return (
    <div className="w-full min-h-screen text-[#4A342E] pt-54 sm:pt-52 md:pt-50 pb-36">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: t("allProducts") }]} />

        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4A342E] tracking-tight">
            {searchQuery ? t("searchResult", { q: searchQuery }) : t("allProducts")}
          </h1>
        </div>

        {/* ซ้าย = หมวดหมู่ / ขวา = รายการสินค้า */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <aside className="w-full lg:w-64 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#8C5A3C]/10 shrink-0 lg:sticky lg:top-56">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100 font-bold text-[#4A342E]">
              <FaFilter className="text-[#8C5A3C] text-sm" />
              <span>{t("categories")}</span>
            </div>
            {loading || categoriesQ.isLoading ? (
              <div className="py-4 text-center text-xs text-[#8C5A3C] animate-pulse">{t("loadingCategories")}</div>
            ) : (
              <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                {categoryCards.map((c) => {
                  const isActive = currentCategory === c.name;
                  // คงคำค้น + การเรียงไว้ตอนเปลี่ยนหมวด
                  const params = new URLSearchParams();
                  if (c.name !== ALL) params.set("category", c.name);
                  if (searchQuery) params.set("q", searchQuery);
                  if (sortBy !== "latest") params.set("sort", sortBy);
                  const qs = params.toString();
                  return (
                    <Link
                      key={c.name}
                      href={`/customer/product${qs ? `?${qs}` : ""}`}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap lg:whitespace-normal ${
                        isActive ? "bg-[#8C5A3C] text-white shadow-sm font-semibold" : "text-[#4A342E] hover:bg-[#8C5A3C]/10"
                      }`}
                    >
                      <span>{c.name === ALL ? t("all") : c.name}</span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full ml-2 ${
                          isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {c.count}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="flex-1 w-full">
            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-[#8C5A3C]/10 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#4A342E]">
                <FaSortAmountDown className="text-[#8C5A3C]" />
                <span>{t("sortBy")}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs sm:text-sm">
                {SORTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSortBy(s)}
                    aria-pressed={sortBy === s}
                    className={`px-3.5 py-2 rounded-xl transition-all font-medium ${
                      sortBy === s ? "bg-[#8C5A3C] text-white shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {t(`sort.${s}`)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <p className="text-base text-[#8C5A3C] font-medium animate-pulse">{t("loading")}</p>
              </div>
            ) : productsQ.isError ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <p className="text-base text-gray-600">{t("loadFailed")}</p>
                <button
                  type="button"
                  onClick={() => productsQ.refetch()}
                  className="px-5 py-2 rounded-xl border border-[#8C5A3C]/30 bg-white font-semibold text-[#4A342E] hover:bg-[#4A342E] hover:text-white transition"
                >
                  {t("retry")}
                </button>
              </div>
            ) : visible.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {visible.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-white/60 rounded-2xl border border-dashed border-[#8C5A3C]/20 text-center px-4">
                <p className="text-base text-gray-500 font-medium mb-1">
                  {searchQuery ? t("noMatch", { q: searchQuery }) : t("noInCategory")}
                </p>
                <p className="text-xs text-gray-500">
                  {searchQuery
                    ? t("tryOtherSearch")
                    : t("tryOtherCategory")}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
