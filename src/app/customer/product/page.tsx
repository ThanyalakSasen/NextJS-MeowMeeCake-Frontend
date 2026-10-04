"use client";
// ─────────────────────────────────────────────────────────────
// สินค้าทั้งหมด — ย้ายมาจาก FrontOffice (customer/product/page.tsx)
// เปลี่ยนจากเดิม: ข้อมูลจาก /catalog/products + /catalog/categories (cache ร่วมกับหน้าแรก)
// · ค้นหาในหน้าเองจาก ?q= (ชื่อไทย/อังกฤษ/รหัสสินค้า) · หมวดจาก ?category=<ชื่อหมวด>
// ตัดออก: คำค้นพ้อง (search-synonyms — backend ยังไม่มี) · เรียง "ขายดี" (catalog ไม่ส่งยอดขายมา)
// ─────────────────────────────────────────────────────────────
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FaFilter, FaSortAmountDown } from "react-icons/fa";
import { catalogService } from "@/services/catalog";
import { effectivePrice } from "@/lib/pricing";
import ProductCard, { categoryNameOf, isProductCardVisible } from "@/components/customer/ProductCard";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { CATALOG_PRODUCT_PARAMS, catalogCategoriesKey, catalogProductsKey } from "../lib/catalogQueries";

const ALL = "ทั้งหมด";
type SortKey = "latest" | "price-asc" | "price-desc";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "latest", label: "มาใหม่ล่าสุด" },
  { key: "price-asc", label: "ราคา: ต่ำ → สูง" },
  { key: "price-desc", label: "ราคา: สูง → ต่ำ" },
];

// ใช้ useSearchParams จึงต้องครอบด้วย Suspense (ไม่งั้น next build จะ error)
export default function ProductListPage() {
  return (
    <Suspense fallback={null}>
      <ProductListContent />
    </Suspense>
  );
}

function ProductListContent() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || ALL;
  const searchQuery = searchParams.get("q")?.trim() || "";
  const [sortBy, setSortBy] = useState<SortKey>("latest");

  const productsQ = useQuery({
    queryKey: catalogProductsKey,
    queryFn: () => catalogService.products(CATALOG_PRODUCT_PARAMS),
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
    let result = [...products];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.product_name_th.toLowerCase().includes(q) ||
          (p.product_name_eng ?? "").toLowerCase().includes(q) ||
          (p.product_id ?? "").toLowerCase().includes(q),
      );
    }
    if (currentCategory !== ALL) result = result.filter((p) => categoryNameOf(p) === currentCategory);
    result.sort((a, b) => {
      // เรียงตามราคาขายจริง (ราคาลดถ้ามี) ให้ตรงกับราคาที่แสดงบนบัตร
      if (sortBy === "price-asc") return effectivePrice(a) - effectivePrice(b);
      if (sortBy === "price-desc") return effectivePrice(b) - effectivePrice(a);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return result;
  }, [products, currentCategory, sortBy, searchQuery]);

  return (
    <div className="w-full min-h-screen text-[#4A342E] pt-54 sm:pt-52 md:pt-50 pb-36">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: "สินค้าทั้งหมด" }]} />

        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4A342E] tracking-tight">
            {searchQuery ? `ผลการค้นหา: "${searchQuery}"` : "สินค้าทั้งหมด"}
          </h1>
        </div>

        {/* ซ้าย = หมวดหมู่ / ขวา = รายการสินค้า */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <aside className="w-full lg:w-64 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#8C5A3C]/10 shrink-0 lg:sticky lg:top-56">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100 font-bold text-[#4A342E]">
              <FaFilter className="text-[#8C5A3C] text-sm" />
              <span>หมวดหมู่สินค้า</span>
            </div>
            {loading || categoriesQ.isLoading ? (
              <div className="py-4 text-center text-xs text-[#8C5A3C] animate-pulse">กำลังเตรียมหมวดหมู่...</div>
            ) : (
              <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                {categoryCards.map((c) => {
                  const isActive = currentCategory === c.name;
                  // คงคำค้นไว้ตอนเปลี่ยนหมวด
                  const params = new URLSearchParams();
                  if (c.name !== ALL) params.set("category", c.name);
                  if (searchQuery) params.set("q", searchQuery);
                  const qs = params.toString();
                  return (
                    <Link
                      key={c.name}
                      href={`/customer/product${qs ? `?${qs}` : ""}`}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap lg:whitespace-normal ${
                        isActive ? "bg-[#8C5A3C] text-white shadow-sm font-semibold" : "text-[#4A342E] hover:bg-[#8C5A3C]/10"
                      }`}
                    >
                      <span>{c.name}</span>
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
                <span>เรียงตาม:</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs sm:text-sm">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSortBy(s.key)}
                    aria-pressed={sortBy === s.key}
                    className={`px-3.5 py-2 rounded-xl transition-all font-medium ${
                      sortBy === s.key ? "bg-[#8C5A3C] text-white shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <p className="text-base text-[#8C5A3C] font-medium animate-pulse">กำลังโหลดสินค้า...</p>
              </div>
            ) : productsQ.isError ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <p className="text-base text-gray-600">โหลดรายการสินค้าไม่สำเร็จ</p>
                <button
                  type="button"
                  onClick={() => productsQ.refetch()}
                  className="px-5 py-2 rounded-xl border border-[#8C5A3C]/30 bg-white font-semibold text-[#4A342E] hover:bg-[#4A342E] hover:text-white transition"
                >
                  ลองใหม่
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
                  {searchQuery ? `ไม่พบสินค้าที่ตรงกับ "${searchQuery}"` : "ไม่พบสินค้าในหมวดหมู่นี้"}
                </p>
                <p className="text-xs text-gray-400">
                  {searchQuery
                    ? "ลองพิมพ์คำค้นหาอื่น หรือเลือกหมวดหมู่เพื่อดูสินค้าทั้งหมด"
                    : "ลองเลือกหมวดหมู่อื่นเพื่อค้นหาเบเกอรี่ที่คุณชื่นชอบ"}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
