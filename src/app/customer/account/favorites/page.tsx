"use client";
// ─────────────────────────────────────────────────────────────
// /customer/account/favorites — รายการโปรดของฉัน (BACKLOG3-merge D5) · ยกจาก FrontOffice src/app/customer/account/favorites/page.tsx
// API: GET /shop/favorites · DELETE /shop/favorites?productId= (ผ่าน useFavorites — cache เดียวกับปุ่มหัวใจในบัตรสินค้า)
// ต่างจากต้นแบบ: ปุ่ม "หยิบใส่ตะกร้า" ใช้ได้จริง (ต้นแบบไม่มี onClick) · สินค้าพรีออเดอร์ = ปุ่ม "ดูสินค้า" (สั่งผ่าน flow พรีออเดอร์ D3)
// · ชื่อ/รูปกดไปหน้าสินค้าได้
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import { FaCheck, FaHeart, FaSpinner, FaStar, FaTruck } from "react-icons/fa";
import { Heart } from "lucide-react";
import type { FavoriteItem } from "@/services/shopFavorites";
import { resolveUploadUrl } from "@/lib/uploads";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { shopButton, shopPage } from "@/components/customer/shopStyles";
import { useFavorites } from "../../hooks/useFavorites";
import { useAddToCart } from "../../hooks/useAddToCart";
import { useProvinceOnlyShipping } from "../../hooks/useProvinceOnlyShipping";
import ShopImage from "@/components/customer/ShopImage";
import { PRODUCT_GRID, PRODUCT_MASONRY_ITEM } from "../../lib/productGrid";

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

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px]">
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
              // คอลัมน์/ระยะห่างแบบเดียวกับการ์ดสินค้าหน้าอื่น (2 / 3 / 5)
              <ul className={`m-0 list-none p-0 ${PRODUCT_GRID}`}>
                {items.map((item) => (
                  <FavoriteCard
                    key={item.id}
                    item={item}
                    removing={favorites.pendingId === item.id}
                    onRemove={() => void favorites.toggle(item.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** บัตรรายการโปรด — หน้าตาเดียวกับ ProductCard ของหน้าอื่น (รูป · หัวใจ · ชื่อ · ป้ายส่งเฉพาะจังหวัด · ราคา/ดาว · ปุ่มเต็มความกว้าง)
 *  ต่างกันแค่: แสดงสินค้าที่ปิดขาย (ป้าย "สินค้าหมด") และพรีออเดอร์ (ปุ่ม "ดูสินค้า") ด้วย — ProductCard ซ่อนสองแบบนี้ */
function FavoriteCard({ item, removing, onRemove }: { item: FavoriteItem; removing: boolean; onRemove: () => void }) {
  const t = useTranslations("shop.favorites");
  const tc = useTranslations("shop.productCard");
  const { names: localNames } = useLocalName();
  const { quickAdd, status } = useAddToCart();
  const shipping = useProvinceOnlyShipping();
  const [imgFailed, setImgFailed] = useState(false);
  const href = `/customer/product/${item.id}`;
  const img = resolveUploadUrl(item.image);
  const names = localNames(item.name, item.nameeg);
  const provinceOnly = !item.is_preorder && !!item.category_id && shipping.isProvinceOnly({ _id: item.id, category_id: item.category_id });
  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <li className={`m-0 list-none ${PRODUCT_MASONRY_ITEM}`}>
      <Link
        href={href}
        className={`group flex flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${item.inStock ? "" : "opacity-75"}`}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
          {img && !imgFailed ? (
            <ShopImage
              src={img}
              alt={item.nameeg || item.name}
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-black">{t("noImage")}</div>
          )}

          <button
            type="button"
            onClick={(e) => {
              // บัตรทั้งใบเป็นลิงก์ — กันไม่ให้กดหัวใจแล้วเปิดหน้าสินค้า
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
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-stone-900/80 px-3 py-1 text-xs font-bold text-white">{t("outOfStock")}</span>
            </div>
          )}
          {item.is_preorder && item.inStock && (
            <span className="pointer-events-none absolute left-1 top-1 rounded-full bg-[#4A342E] px-2 py-0 text-[11px] font-bold leading-5 text-white">{t("preorder")}</span>
          )}
        </div>

        <div className="flex flex-col !bg-[#fff] p-2.5 sm:p-3">
          <div>
            <h2 className="m-0 line-clamp-1 text-sm font-semibold text-black md:text-[0.9444rem] xl:text-base">{names.primary}</h2>
            <p className="m-0 mb-2 line-clamp-1 text-sm text-black">{names.secondary || " "}</p>
            {provinceOnly && (
              <p
                className="-mt-1.5 mb-0.5 inline-flex max-w-full items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-1.5 py-0 text-xs font-medium leading-5 text-sky-800"
                title={tc("provinceOnlyHint")}
              >
                <FaTruck className="shrink-0 text-[0.7rem]" />
                <span className="truncate">{shipping.province ? tc("provinceOnly", { province: shipping.province }) : tc("provinceOnlyGeneric")}</span>
              </p>
            )}
          </div>

          <div>
            <div className="my-1 flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
              {item.originalPrice ? (
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-1 whitespace-nowrap">
                  <span className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-red-600">฿</span>
                    <span className="text-sm font-extrabold text-red-600 md:text-[0.9444rem] xl:text-base">{item.price.toLocaleString()}</span>
                  </span>
                  <span className="text-xs text-stone-500 line-through">฿{item.originalPrice.toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex min-w-0 items-baseline gap-1 whitespace-nowrap">
                  <span className="text-sm font-bold text-[#8C5A3C]">฿</span>
                  <span className="text-sm font-extrabold text-[#8C5A3C] md:text-[0.9444rem] xl:text-base">{item.price.toLocaleString()}</span>
                </div>
              )}
              <div className="flex shrink-0 items-center gap-2 pb-0.5 text-xs font-medium text-black">
                <FaStar className="text-base text-amber-400" />
                <span>{item.rating === "-" ? "0.0" : Number(item.rating).toFixed(1)}</span>
              </div>
            </div>

            {item.is_preorder ? (
              <span className="mt-1 flex h-[44px] w-full items-center justify-center rounded-xl border border-[#8C5A3C]/30 !bg-white px-2 text-sm font-bold !text-[#4A342E] shadow-md shadow-[#4A342E]/20 transition-all duration-200 group-hover:!bg-[#4A342E] group-hover:!text-white">
                {t("view")}
              </span>
            ) : (
              <button
                type="button"
                disabled={!item.inStock || isLoading || isSuccess}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void quickAdd(item.id);
                }}
                className={`mt-1 flex h-[44px] w-full items-center justify-center gap-1 rounded-xl px-2 text-sm font-bold transition-all duration-200 ${
                  isSuccess
                    ? "border border-emerald-600 !bg-emerald-600 !text-white shadow-md"
                    : "border border-[#8C5A3C]/30 !bg-white !text-[#4A342E] shadow-md shadow-[#4A342E]/20 hover:!bg-[#4A342E] hover:!text-white hover:shadow-lg active:scale-[0.98]"
                } disabled:cursor-not-allowed disabled:opacity-75`}
              >
                {!item.inStock ? (
                  t("soldOut")
                ) : isLoading ? (
                  <>
                    <FaSpinner className="animate-spin text-xs" /> <span>{t("adding")}</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <FaCheck className="text-xs" /> <span>{t("added")}</span>
                  </>
                ) : (
                  t("addToCart")
                )}
              </button>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
