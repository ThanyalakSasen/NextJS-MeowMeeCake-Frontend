"use client";
// ─────────────────────────────────────────────────────────────
// บัตรสินค้าของหน้าร้าน — ย้ายมาจาก FrontOffice (components/customer/ProductCard.tsx)
// เปลี่ยนจากเดิม: ใช้ Product ของ backend หลัก (is_preorder แทน product_type) · รูปผ่าน resolveUploadUrl
// · คะแนนรีวิวแสดง avg_rating (เดิมแสดง review_count ผิดช่อง)
// · ปุ่มหัวใจ (รายการโปรด D5/U3) อ่านจาก cache เดียวของ useFavorites — ไม่ยิงขอรายการต่อใบแบบต้นแบบ
// · ป้ายแพ้อาหาร: ทุกบัตร — จาก /shop/allergen-warnings (useAllergenWarnings · ล็อกอิน + บันทึกอาหารที่แพ้ไว้)
//   ผลของระบบแนะนำ (สินค้าคล้าย C1 · แนะนำสำหรับคุณ C2) ส่งมาเป็น props ได้ — ใช้ props ก่อน
// · เหตุผลที่แนะนำ: ส่งมาเป็น props จากผลของระบบแนะนำเท่านั้น
// · "เพิ่มลงตะกร้า" = quickAdd: สินค้ามีตัวเลือก → พาไปหน้าสินค้าให้เลือกก่อน
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import { FaSpinner, FaCheck, FaStar, FaHeart, FaRegHeart } from "react-icons/fa";
import type { Product } from "@/types/product";
import { resolveUploadUrl } from "@/lib/uploads";
import { effectivePrice, hasSalePrice, salePercent } from "@/lib/pricing";
import { useAddToCart } from "@/app/customer/hooks/useAddToCart";
import { useFavorites } from "@/app/customer/hooks/useFavorites";
import { useAllergenWarnings } from "@/app/customer/hooks/useAllergenWarnings";
import type { AllergenWarning, AllergenWarningLevel } from "@/services/catalog";
import ShopImage from "./ShopImage";

/**
 * สินค้านี้จะถูกแสดงเป็นบัตรหรือไม่ — ProductCard จะ return null ถ้าได้ false
 * (พรีออเดอร์ / สต็อกเป็น 0 หรือ null / is_visible === false)
 * หน้าที่นับจำนวนสินค้า (เช่น ตัวเลขหมวดหมู่) ควรกรองด้วยฟังก์ชันนี้ก่อน ตัวเลขจะได้ตรงกับบัตรที่แสดงจริง
 */
export function isProductCardVisible(p: Pick<Product, "product_stock_quantity" | "is_preorder" | "is_visible">): boolean {
  const qty = p.product_stock_quantity;
  const outOfStock = qty === null || qty === undefined || Number(qty) <= 0;
  return !(outOfStock || p.is_preorder || p.is_visible === false);
}

export function categoryNameOf(p: Pick<Product, "category_id">): string | undefined {
  return typeof p.category_id === "object" && p.category_id ? p.category_id.product_category_name?.trim() : undefined;
}

const ALLERGEN_TONE: Record<Exclude<AllergenWarningLevel, "none">, string> = {
  caution: "bg-amber-100 text-amber-900 border-amber-300",
  warning: "bg-orange-100 text-orange-900 border-orange-300",
  danger: "bg-red-600 text-white border-red-700",
};

/** ป้ายแพ้อาหาร — ชื่อวัตถุดิบที่ตรงกับที่ลูกค้าบันทึกไว้ (2 ชื่อแรก + ที่เหลือ) */
function allergenLabel(w: AllergenWarning, t: ReturnType<typeof useTranslations<"shop.productCard">>): string {
  const names = w.matchedAllergens.map((m) => m.name);
  if (names.length === 0) return t("hasAllergen");
  return t("allergens", { names: `${names.slice(0, 2).join(", ")}${names.length > 2 ? ` +${names.length - 2}` : ""}` });
}

/** ป้ายเตือนแพ้อาหารมุมซ้ายบนของรูปสินค้า — ใช้ทั้งบัตรสินค้าปกติและบัตรพรีออเดอร์ · ไม่มีคำเตือน = ไม่แสดง */
export function AllergenBadge({ warning }: { warning: AllergenWarning | null }) {
  const t = useTranslations("shop.productCard");
  if (!warning || warning.level === "none") return null;
  return (
    <span
      title={warning.message ?? undefined}
      className={`absolute left-1 top-1 max-w-[55%] truncate rounded-full border px-1.5 py-0 text-[11px] font-medium leading-4 shadow-sm ${ALLERGEN_TONE[warning.level]}`}
    >
      {allergenLabel(warning, t)}
    </span>
  );
}

export default function ProductCard({
  product,
  showAddToCart = true,
  showFavorite = true,
  allergenWarning: allergenWarningProp = null,
  reasons,
  priority = false,
}: {
  product: Product;
  showAddToCart?: boolean;
  showFavorite?: boolean;
  /** จากระบบแนะนำ (สินค้าคล้าย · แนะนำสำหรับคุณ) — มีเมื่อ login + บันทึกอาหารที่แพ้ไว้ */
  allergenWarning?: AllergenWarning | null;
  /** เหตุผลที่แนะนำ — แสดงข้อแรก */
  reasons?: string[];
  /** บัตรแถวแรกของหน้า (เหนือขอบจอ) — โหลดรูปทันทีด้วยความสำคัญสูง (LCP) */
  priority?: boolean;
}) {
  const t = useTranslations("shop.productCard");
  const { names: localNames } = useLocalName();
  const { quickAdd, status } = useAddToCart();
  const favorites = useFavorites();
  const allergenWarningOf = useAllergenWarnings();
  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const [failedImg, setFailedImg] = useState<string | null>(null);

  if (!isProductCardVisible(product)) return null;

  const categoryName = categoryNameOf(product);
  const imgSrc = resolveUploadUrl(product.product_img?.[0]);
  const rating = Number(product.avg_rating ?? 0);
  const favorite = favorites.isFavorite(product._id);
  const allergenWarning = allergenWarningProp ?? allergenWarningOf(product._id);

  return (
    <Link
      href={`/customer/product/${product._id}`}
      className="group block bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        {/* รูปที่โหลดไม่ขึ้น (ไฟล์หายจากเซิร์ฟเวอร์) → แสดง "ไม่มีรูปภาพ" แทนรูปแตก */}
        {imgSrc && imgSrc !== failedImg ? (
          <ShopImage
            src={imgSrc}
            alt={product.product_name_eng || product.product_name_th}
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            priority={priority}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setFailedImg(imgSrc)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-black text-xs font-medium">{t("noImage")}</div>
        )}

        {showFavorite && (
          <button
            type="button"
            aria-pressed={favorite}
            aria-label={favorite ? t("removeFavorite") : t("addFavorite")}
            title={favorite ? t("removeFavorite") : t("addFavorite")}
            disabled={favorites.pendingId === product._id}
            onClick={(e) => {
              // บัตรทั้งใบเป็นลิงก์ — กันไม่ให้กดหัวใจแล้วเปิดหน้าสินค้า
              e.preventDefault();
              e.stopPropagation();
              void favorites.toggle(product._id, {
                name: product.product_name_th,
                nameeg: product.product_name_eng ?? "",
                category: categoryName ?? "",
                price: effectivePrice(product),
                image: product.product_img?.[0] ?? "",
                is_preorder: !!product.is_preorder,
              });
            }}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur-sm transition hover:scale-110 hover:bg-white disabled:opacity-60"
          >
            {favorites.pendingId === product._id ? (
              <FaSpinner className="animate-spin text-xs text-stone-500" />
            ) : favorite ? (
              <FaHeart className="text-sm text-red-500" />
            ) : (
              <FaRegHeart className="text-sm text-black hover:text-red-500" />
            )}
          </button>
        )}

        <AllergenBadge warning={allergenWarning} />
      </div>

      {/* ฟอนต์อิงฐาน 18px (globals.css html 112.5%) · ขั้นต่ำของแอป 16px = text-sm/text-xs · 17px = text-[0.9444rem] · 18px = text-base
          ชื่อ/ราคา โตตามจอ 16 → 17 (≥768) → 18 (≥1280) · ชื่อรอง/฿/ปุ่ม คงที่ 16 (ขั้นต่ำ — ห้ามใช้ค่า px ที่เล็กกว่านี้) */}
      <div className="p-5 sm:p-3 flex flex-col justify-between !bg-[#fff]">
        <div>
          <h3 className="text-sm md:text-[0.9444rem] xl:text-base font-semibold text-black line-clamp-1">
            {localNames(product.product_name_th, product.product_name_eng).primary}
          </h3>
          <p className="text-sm text-black line-clamp-1 mb-2">
            {localNames(product.product_name_th, product.product_name_eng).secondary || " "}
          </p>
          {reasons?.[0] && <p className="-mt-1 mb-2 line-clamp-1 text-xs text-[#8C5A3C]">{reasons[0]}</p>}
        </div>

        <div>
          <div className="flex items-end justify-between my-1">
            {/* ราคา — กำลังลดราคา: ราคาลดสีแดง + ราคาเดิมขีดฆ่า + ป้าย % */}
            {hasSalePrice(product) ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-red-600">฿</span>
                  <span className="text-sm md:text-[0.9444rem] xl:text-base font-extrabold text-red-600">
                    {effectivePrice(product).toLocaleString()}
                  </span>
                </span>
                <span className="text-xs text-stone-500 line-through">฿{product.product_price?.toLocaleString()}</span>
                <span className="text-sm font-bold text-white bg-red-500 rounded px-1 py-0.5 leading-none">
                  -{salePercent(product)}%
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-[#8C5A3C]">฿</span>
                <span className="text-sm md:text-[0.9444rem] xl:text-base font-extrabold text-[#8C5A3C]">
                  {product.product_price?.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-black text-xs font-medium pb-0.5" title={t("reviews", { n: product.review_count ?? 0 })}>
              <FaStar className="text-amber-400 text-base" />
              <span>{rating.toFixed(1)}</span>
            </div>
          </div>

          {showAddToCart && (
            <button
              type="button"
              disabled={isLoading || isSuccess}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void quickAdd(product._id);
              }}
              className={`w-full h-[44px] px-2 mt-1 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1 ${
                isSuccess
                  ? "!bg-emerald-600 border border-emerald-600 !text-white shadow-md"
                  : "!bg-white !text-[#4A342E] border border-[#8C5A3C]/30 shadow-md shadow-[#4A342E]/20 hover:!bg-[#4A342E] hover:!text-white hover:shadow-lg active:scale-[0.98]"
              } disabled:opacity-75 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin text-xs" />
                  <span>{t("adding")}</span>
                </>
              ) : isSuccess ? (
                <>
                  <FaCheck className="text-xs" />
                  <span>{t("added")}</span>
                </>
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
