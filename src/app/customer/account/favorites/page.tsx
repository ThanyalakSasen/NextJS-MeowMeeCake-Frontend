"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/favorites — รายการโปรดของฉัน (BACKLOG3-merge D5) · ยกจาก FrontOffice src/app/customer/account/favorites/page.tsx
// API: GET /shop/favorites · DELETE /shop/favorites?productId= (ผ่าน useFavorites — cache เดียวกับปุ่มหัวใจในบัตรสินค้า)
// ต่างจากต้นแบบ: ปุ่ม "หยิบใส่ตะกร้า" ใช้ได้จริง (ต้นแบบไม่มี onClick) · สินค้าพรีออเดอร์ = ปุ่ม "ดูสินค้า" (สั่งผ่าน flow พรีออเดอร์ D3)
// · ชื่อ/รูปกดไปหน้าสินค้าได้
// การ์ดเหมือนหน้าอื่น (2026-10-29): สินค้าปกติที่ยังเปิดขาย = ProductCard ตัวเดียวกับหน้าสินค้าทั้งหมด (ข้อมูลจาก catalog cache เดียวกัน)
// · ตาราง productGrid เดียวกัน · สินค้าหมดขึ้น "สินค้าหมด" แบบเดียวกัน · พรีออเดอร์ / ปิดขายแล้ว = FavoriteCard หน้าตาเดียวกัน
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import { FaCheck, FaHeart, FaSpinner, FaStar } from "react-icons/fa";
import { Heart } from "lucide-react";
import { catalogService } from "@/services/catalog";
import ProductCard, { isProductCardVisible } from "@/components/customer/ProductCard";
import { CATALOG_PRODUCT_PARAMS, catalogProductsKey } from "../../lib/catalogQueries";
import type { FavoriteItem } from "@/services/shopFavorites";
import { resolveUploadUrl } from "@/lib/uploads";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import {
  baht,
  productCardBody,
  productCardButton,
  productCardFrame,
  productCardImage,
  productCardSubtitle,
  productCardTitle,
  productGrid,
  shopButton,
  shopPage,
} from "@/components/customer/shopStyles";
import { useFavorites } from "../../hooks/useFavorites";
import { useAddToCart } from "../../hooks/useAddToCart";
import ShopImage from "@/components/customer/ShopImage";

export default function FavoritesPage() {
  const t = useTranslations("shop.favorites");
  return (
    <CustomerAuthGate message={t("loginToView")}>
      <FavoritesContent />
    </CustomerAuthGate>
  );
}

function FavoritesContent() {
  const t = useTranslations("shop.favorites");
  const ta = useTranslations("shop.accountMenu");
  const to = useTranslations("shop.orders");
  const favorites = useFavorites();
  const { query: q, items } = favorites;
  // สินค้าปกติ — ใช้ข้อมูลเต็มจาก catalog (cache เดียวกับหน้าสินค้าทั้งหมด/หน้าแรก) เพื่อวาด ProductCard ตัวเดียวกัน
  const catalogQ = useQuery({ queryKey: catalogProductsKey, queryFn: () => catalogService.products(CATALOG_PRODUCT_PARAMS) });
  const productById = useMemo(() => new Map((catalogQ.data?.data ?? []).map((p) => [p._id, p])), [catalogQ.data]);

  return (
    <div className={shopPage}>
      {/* กว้างกว่าหน้าบัญชีอื่น (1320px · ขอบแคบ) — ให้การ์ดแถวละ 6 บนจอใหญ่ไม่เล็กเกินไป */}
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-5 px-[12px] sm:px-[16px] md:px-[24px] xl:px-[32px]">
        <CustomerBreadcrumb items={[{ label: to("myAccount"), href: "/customer/account" }, { label: ta("favorites") }]} className="!mb-0" />
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <header className="space-y-1 border-b border-stone-200 pb-5">
              <h1 className="m-0 flex items-center gap-2 text-xl font-bold text-stone-800 sm:text-2xl">
                <Heart className="h-6 w-6 text-[#4A342E]" aria-hidden="true" /> {t("title")}
              </h1>
              <p className="m-0 text-sm text-stone-500">{t("count", { n: items.length })}</p>
            </header>

            {q.isLoading ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center text-sm text-stone-500">{t("loading")}</p>
            ) : q.isError ? (
              <p className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">{t("loadFailed")}</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center">
                <div className="rounded-full bg-amber-50/60 p-4">
                  <Heart className="h-12 w-12 text-[#D6C7BD]" aria-hidden="true" />
                </div>
                <p className="m-0 font-medium text-stone-500">{t("empty")}</p>
                <p className="m-0 text-xs text-stone-500">{t("emptyHint")}</p>
                <Link href="/customer/product" className={shopButton}>{t("shopNow")}</Link>
              </div>
            ) : (
              // ตารางเดียวกับหน้าสินค้าทั้งหมด (productGrid)
              <div className={productGrid}>
                {items.map((item) => {
                  const product = productById.get(item.id);
                  return product && isProductCardVisible(product, { includeSoldOut: true }) ? (
                    <ProductCard key={item.id} product={product} allowSoldOut />
                  ) : (
                    <FavoriteCard
                      key={item.id}
                      item={item}
                      removing={favorites.pendingId === item.id}
                      onRemove={() => void favorites.toggle(item.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * การ์ดรายการโปรด — โครงเดียวกับการ์ดสินค้าหน้าอื่น (shopStyles: กรอบ · รูปสี่เหลี่ยมจัตุรัส · ชื่อ · ราคา|ดาว · ปุ่มเต็มกว้าง)
 * ต่างตรงที่: หัวใจมุมขวาบน = เอาออกจากรายการโปรด · แสดงสินค้าหมด/พรีออเดอร์ด้วย (หน้าอื่นซ่อน)
 */
function FavoriteCard({ item, removing, onRemove }: { item: FavoriteItem; removing: boolean; onRemove: () => void }) {
  const t = useTranslations("shop.favorites");
  const { names: localNames } = useLocalName();
  const { quickAdd, status } = useAddToCart();
  const [imgFailed, setImgFailed] = useState(false);
  const href = `/customer/product/${item.id}`;
  const img = resolveUploadUrl(item.image);
  const names = localNames(item.name, item.nameeg);

  return (
      <Link href={href} className={productCardFrame}>
        <div className={productCardImage}>
          {img && !imgFailed ? (
            <ShopImage
              src={img}
              alt={item.name}
              sizes="(min-width: 1280px) 16vw, (min-width: 640px) 33vw, 50vw"
              className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${item.inStock ? "" : "grayscale opacity-60"}`}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-stone-500">{t("noImage")}</span>
          )}

          <button
            type="button"
            onClick={(e) => {
              // การ์ดทั้งใบเป็นลิงก์ — กันไม่ให้กดหัวใจแล้วเปิดหน้าสินค้า
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            disabled={removing}
            aria-label={t("removeAria", { name: item.name })}
            title={t("remove")}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur-sm transition hover:scale-110 hover:bg-white disabled:opacity-60"
          >
            {removing ? <FaSpinner className="animate-spin text-xs text-stone-500" /> : <FaHeart className="text-sm text-red-500" />}
          </button>

          {!item.inStock && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-stone-900/80 px-3 py-1 text-xs font-bold text-white shadow-md">{t("outOfStock")}</span>
            </span>
          )}
          {item.is_preorder && item.inStock && (
            <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-[#4A342E] px-2 py-0.5 text-[11px] font-bold text-white">{t("preorder")}</span>
          )}
        </div>

        <div className={productCardBody}>
          <div className="min-w-0">
            <h3 className={productCardTitle}>{names.primary}</h3>
            <p className={productCardSubtitle}>{names.secondary || " "}</p>
          </div>

          <div className="mt-auto space-y-2">
            <div className="flex items-end justify-between gap-2">
              <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
                <span className={`text-sm font-extrabold md:text-[0.9444rem] xl:text-base ${item.originalPrice ? "text-red-600" : "text-[#8C5A3C]"}`}>
                  {baht(item.price)}
                </span>
                {item.originalPrice ? <span className="text-xs text-stone-500 line-through">{baht(item.originalPrice)}</span> : null}
              </span>
              {/* ดาวแสดงทุกใบเหมือน ProductCard (ยังไม่มีรีวิว = 0.0) */}
              <span className="flex shrink-0 items-center gap-1 pb-0.5 text-xs font-medium text-stone-700">
                <FaStar className="text-amber-400" aria-hidden="true" />
                <span>{item.rating === "-" ? "0.0" : Number(item.rating).toFixed(1)}</span>
              </span>
            </div>

            {item.is_preorder ? (
              <span className={productCardButton}>{t("view")}</span>
            ) : (
              <button
                type="button"
                disabled={!item.inStock || status === "loading" || status === "success"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void quickAdd(item.id);
                }}
                className={`${productCardButton} ${status === "success" ? "!border-emerald-600 !bg-emerald-600 !text-white" : ""} disabled:cursor-not-allowed disabled:opacity-75`}
              >
                {!item.inStock ? (
                  t("soldOut")
                ) : status === "loading" ? (
                  <><FaSpinner className="animate-spin text-xs" /> {t("adding")}</>
                ) : status === "success" ? (
                  <><FaCheck className="text-xs" /> {t("added")}</>
                ) : (
                  t("addToCart")
                )}
              </button>
            )}
          </div>
        </div>
      </Link>
  );
}
