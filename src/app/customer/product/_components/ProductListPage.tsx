"use client";
// ─────────────────────────────────────────────────────────────
// สินค้าทั้งหมด — ย้ายมาจาก FrontOffice (customer/product/page.tsx)
// เปลี่ยนจากเดิม: ข้อมูลจาก /catalog/products + /catalog/categories (cache ร่วมกับหน้าแรก) · หมวดจาก ?category=<ชื่อหมวด>
// · ค้นหา ?q= ที่ server (/catalog/products?search= — backend ขยายคำพ้องให้ · BACKLOG4 U4 / H6) แทนการกรองในหน้า
//   ซึ่งหาคำพ้องไม่เจอ · จำนวนในหมวดนับจากผลค้นหา (เห็นว่าผลอยู่หมวดไหน)
// · เรียงตามเก็บใน ?sort= (กลับจากหน้าสินค้าแล้วยังเรียงแบบเดิม)
// ต่างจากต้นแบบ: "ขายดี" → "คะแนนรีวิวสูงสุด" (catalog ไม่ส่งยอดขายมา · avg_rating มี)
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FaFilter, FaSortAmountDown, FaTimes } from "react-icons/fa";
import { catalogService } from "@/services/catalog";
import { effectivePrice } from "@/lib/pricing";
import ProductCard, { categoryNameOf, isProductCardVisible } from "@/components/customer/ProductCard";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { CATALOG_PRODUCT_PARAMS, catalogCategoriesKey, catalogProductsKey } from "../../lib/catalogQueries";
import { thaiCompare } from "@/lib/thaiSort";

/** หมวด "ทั้งหมด" — ค่าภายใน (ชื่อที่แสดงมาจาก i18n) */
const ALL = "__all__";
type SortKey = "latest" | "rating" | "price-asc" | "price-desc";
const SORTS: SortKey[] = ["latest", "rating", "price-asc", "price-desc"];
const isSortKey = (v: string | null): v is SortKey => SORTS.some((s) => s === v);

/**
 * query = search string ของ URL (category · q · sort) ส่งมาจาก page.tsx (server) — ไม่ใช้ useSearchParams
 * เพราะ useSearchParams ทำให้เนื้อหาทั้งหน้าต้องอยู่ใต้ <Suspense> ซึ่งถูกส่งตามมาท้าย HTML →
 * รูปหลักขึ้นช้า (Lighthouse LCP render delay ~3.6 วิ) · เปลี่ยน ?q/?sort ด้วย router.replace → server ส่ง query ใหม่มาเอง
 */
export default function ProductListPage({ query }: { query: string }) {
  const t = useTranslations("shop.products");
  const searchParams = useMemo(() => new URLSearchParams(query), [query]);
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
  // isPending ไม่ใช่ isLoading — ตอน render ฝั่ง server isLoading = false (ยังไม่ fetch) HTML แรกจึงเป็นสถานะ "ไม่มีข้อมูล"
  // แล้วสลับเป็นกำลังโหลด → ข้อมูลจริง = หน้ากระโดด (Lighthouse CLS)
  const loading = productsQ.isPending;

  // กรองสินค้าที่บัตรไม่แสดง (พรีออเดอร์ / หมดสต็อก / ซ่อน) ออกตั้งแต่ต้น — ตัวเลขจำนวนในหมวดจะได้ตรงกับบัตรที่เห็นจริง
  const products = useMemo(() => (productsQ.data?.data ?? []).filter(isProductCardVisible), [productsQ.data]);

  // หมวดพร้อมจำนวนสินค้า — ซ่อนหมวดที่ไม่มีสินค้า เรียง ก-ฮ ("ทั้งหมด" อยู่บนสุดเสมอ)
  const categoryCards = useMemo(() => {
    const names = (categoriesQ.data ?? []).map((c) => c.product_category_name?.trim()).filter((n): n is string => !!n);
    const counted = names
      .map((name) => ({ name, count: products.filter((p) => categoryNameOf(p) === name).length }))
      .filter((c) => c.count > 0)
      .sort((a, b) => thaiCompare(a.name, b.name));
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

  // จอ <768px: ตัวกรอง (หมวด + เรียง) อยู่ในแผงเลื่อนเข้าจากขวา เปิดด้วยปุ่มไอคอน
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!sheetOpen) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    // ล็อกการเลื่อนหน้าข้างหลังระหว่างเปิดแผ่น
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);
  const filterActive = currentCategory !== ALL || sortBy !== "latest";

  /** ลิงก์เปลี่ยนหมวด — คงคำค้น + การเรียงไว้ */
  const categoryHref = (name: string) => {
    const params = new URLSearchParams();
    if (name !== ALL) params.set("category", name);
    if (searchQuery) params.set("q", searchQuery);
    if (sortBy !== "latest") params.set("sort", sortBy);
    const qs = params.toString();
    return `/customer/product${qs ? `?${qs}` : ""}`;
  };

  /** ล้างตัวกรอง = หมวดกลับเป็น "ทั้งหมด" + เรียงแบบมาใหม่ล่าสุด · คงคำค้น (?q=) ไว้ */
  const clearFilters = () => {
    setSheetOpen(false);
    const qs = searchQuery ? `?${new URLSearchParams({ q: searchQuery }).toString()}` : "";
    router.replace(`/customer/product${qs}`, { scroll: false });
  };

  return (
    <div className="w-full min-h-screen text-[#4A342E] pt-54 sm:pt-52 md:pt-50 pb-36">
      <div className="w-full max-w-[1200px] mx-auto px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px]">
        <CustomerBreadcrumb items={[{ label: t("allProducts") }]} />

        {/* หัวข้อ · จอ <768px: ปุ่มล้าง (เมื่อกำลังกรอง) + ปุ่มไอคอนตัวกรอง ชิดขวาแถวเดียวกัน · หมวด/การเรียงที่เลือกอยู่ใต้หัวข้อ */}
        <div className="mb-4 md:mb-8 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4A342E] tracking-tight break-words">
              {searchQuery ? t("searchResult", { q: searchQuery }) : t("allProducts")}
            </h1>
            <p className="md:hidden m-0 mt-1 truncate text-sm text-[#4A342E]">
              <span className="font-semibold">{currentCategory === ALL ? t("all") : currentCategory}</span>
              <span className="text-stone-500"> · {t(`sort.${sortBy}`)}</span>
            </p>
          </div>

          <div className="md:hidden flex shrink-0 items-center gap-2">
            {filterActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex h-[44px] items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[#8C5A3C] transition hover:bg-[#8C5A3C]/10"
              >
                <FaTimes size={14} aria-hidden="true" />
                {t("clearFilters")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label={t("openFilters")}
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              className="relative flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-[#8C5A3C]/20 bg-white text-[#8C5A3C] shadow-sm transition hover:bg-[#8C5A3C]/10"
            >
              <FaFilter size={18} />
              {filterActive && (
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" aria-label={t("filterActive")} />
              )}
            </button>
          </div>
        </div>

        {/* แผงตัวกรอง (จอ <768px) — เลื่อนเข้าจากขวา เต็มความสูง · เลือกแล้วกรองทันทีและปิดแผง · Esc / แตะพื้นหลัง = ปิด */}
        {sheetOpen && (
          <div className="md:hidden fixed inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} aria-hidden="true" />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-filter-title"
              className="relative h-full w-[85vw] max-w-[360px] overflow-y-auto rounded-l-2xl bg-white px-[20px] pb-8 pt-4 shadow-2xl animate-slide-in-right"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 id="product-filter-title" className="m-0 flex items-center gap-2 text-base font-bold text-[#4A342E]">
                  <FaFilter className="text-[#8C5A3C]" size={16} />
                  {t("filters")}
                </h2>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label={t("closeFilters")}
                  className="flex h-[44px] w-[44px] items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              <h3 className="m-0 mb-2 text-sm font-semibold text-stone-600">{t("categories")}</h3>
              <div className="mb-5 flex flex-wrap gap-2">
                {categoryCards.map((c) => {
                  const isActive = currentCategory === c.name;
                  return (
                    <Link
                      key={c.name}
                      href={categoryHref(c.name)}
                      onClick={() => setSheetOpen(false)}
                      aria-current={isActive ? "true" : undefined}
                      className={`flex h-[44px] items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition ${
                        isActive ? "bg-[#8C5A3C] text-white shadow-sm font-semibold" : "bg-gray-50 text-[#4A342E] hover:bg-[#8C5A3C]/10"
                      }`}
                    >
                      <span>{c.name === ALL ? t("all") : c.name}</span>
                      <span className={`rounded-full px-2 text-sm ${isActive ? "bg-black/25 text-white" : "bg-white text-gray-600"}`}>
                        {c.count}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <h3 className="m-0 mb-2 text-sm font-semibold text-stone-600">{t("sortBy")}</h3>
              <div className="flex flex-wrap gap-2">
                {SORTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSortBy(s);
                      setSheetOpen(false);
                    }}
                    aria-pressed={sortBy === s}
                    className={`h-[44px] rounded-xl px-3.5 text-sm font-medium transition ${
                      sortBy === s ? "bg-[#8C5A3C] text-white shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {t(`sort.${s}`)}
                  </button>
                ))}
              </div>

              {/* ล้างตัวกรอง — กดไม่ได้เมื่อเป็นค่าเริ่มต้นอยู่แล้ว */}
              <button
                type="button"
                onClick={clearFilters}
                disabled={!filterActive}
                className="mt-6 flex h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#8C5A3C]/30 text-sm font-semibold text-[#8C5A3C] transition hover:bg-[#8C5A3C]/10 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-500 disabled:hover:bg-transparent"
              >
                <FaTimes size={14} aria-hidden="true" />
                {t("clearFilters")}
              </button>
            </div>
          </div>
        )}

        {/* ซ้าย = หมวดหมู่ / ขวา = รายการสินค้า · จอ <768px ซ่อน (ใช้แผ่นตัวกรองแทน) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <aside className="hidden md:block w-full lg:w-64 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#8C5A3C]/10 shrink-0 lg:sticky lg:top-56">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100 font-bold text-[#4A342E]">
              <FaFilter className="text-[#8C5A3C] text-sm" />
              {/* h2 — การ์ดสินค้าเป็น h3 ต้องมี h2 คั่นจาก h1 (Lighthouse heading-order) */}
              <h2 className="m-0 text-base font-bold">{t("categories")}</h2>
            </div>
            {loading || categoriesQ.isPending ? (
              <div className="py-4 text-center text-xs text-[#8C5A3C]">{t("loadingCategories")}</div>
            ) : (
              // 768–1023px: หลายแถว (ขึ้นบรรทัดใหม่เมื่อไม่พอ) ไม่ต้องเลื่อนซ้ายขวา · ≥1024px: แถบซ้ายแนวตั้ง
              <div className="flex flex-row flex-wrap lg:flex-col lg:flex-nowrap gap-1.5">
                {categoryCards.map((c) => {
                  const isActive = currentCategory === c.name;
                  return (
                    <Link
                      key={c.name}
                      href={categoryHref(c.name)}
                      className={`flex min-h-[44px] items-center justify-between px-3.5 py-1 rounded-xl text-sm font-medium transition-all whitespace-nowrap lg:whitespace-normal ${
                        isActive ? "bg-[#8C5A3C] text-white shadow-sm font-semibold" : "text-[#4A342E] hover:bg-[#8C5A3C]/10"
                      }`}
                    >
                      <span>{c.name === ALL ? t("all") : c.name}</span>
                      <span
                        className={`text-sm px-2 rounded-full ml-2 ${
                          isActive ? "bg-black/25 text-white" : "bg-gray-100 text-gray-600"
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
            {/* เรียงตาม — จอ <768px อยู่ในแผ่นตัวกรอง */}
            <div className="hidden md:flex bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-[#8C5A3C]/10 mb-6 flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                    className={`h-[44px] px-3.5 rounded-xl transition-all font-medium ${
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
                <p className="text-base text-[#8C5A3C] font-medium">{t("loading")}</p>
              </div>
            ) : productsQ.isError ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <p className="text-base text-gray-600">{t("loadFailed")}</p>
                <button
                  type="button"
                  onClick={() => productsQ.refetch()}
                  className="h-[44px] px-5 text-sm rounded-xl border border-[#8C5A3C]/30 bg-white font-semibold text-[#4A342E] hover:bg-[#4A342E] hover:text-white transition"
                >
                  {t("retry")}
                </button>
              </div>
            ) : visible.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {/* h2 ซ่อน (absolute — ไม่กินช่อง grid) (สำหรับ screen reader) — จอมือถือแผงหมวดหมู่ที่มี h2 ถูกซ่อน การ์ดสินค้า (h3) จะต่อจาก h1 ตรง ๆ (Lighthouse heading-order) */}
                <h2 className="sr-only">{t("listHeading")}</h2>
                {/* 2 ใบแรก = แถวแรกบนมือถือ (รูปใหญ่สุดเหนือขอบจอ — LCP) → โหลดก่อน */}
                {visible.map((p, i) => (
                  <ProductCard key={p._id} product={p} priority={i < 2} />
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
