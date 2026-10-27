"use client";
// ─────────────────────────────────────────────────────────────
// บัตรสินค้าของหน้าร้าน — ย้ายมาจาก FrontOffice (components/customer/ProductCard.tsx)
// เปลี่ยนจากเดิม: ใช้ Product ของ backend หลัก (is_preorder แทน product_type) · รูปผ่าน resolveUploadUrl
// · คะแนนรีวิวแสดง avg_rating (เดิมแสดง review_count ผิดช่อง)
// · ปุ่มหัวใจ (รายการโปรด D5/U3) อ่านจาก cache เดียวของ useFavorites — ไม่ยิงขอรายการต่อใบแบบต้นแบบ
// · ป้ายแพ้อาหาร: ทุกบัตร — จาก /shop/allergen-warnings (useAllergenWarnings · ล็อกอิน + บันทึกอาหารที่แพ้ไว้)
//   ผลของระบบแนะนำ (สินค้าคล้าย C1 · แนะนำสำหรับคุณ C2) ส่งมาเป็น props ได้ — ใช้ props ก่อน
// · "เพิ่มลงตะกร้า" = quickAdd: สินค้ามีตัวเลือก → พาไปหน้าสินค้าให้เลือกก่อน
// · ป้าย "ส่งเฉพาะ จ.…" มุมซ้ายล่างของรูป — สินค้าที่ส่งนอกจังหวัดร้านไม่ได้ (useLocalOnlyShipping)
// · โครงบัตร (กรอบ · รูป · ระยะ · ตัวอักษร · ปุ่ม) มาจาก shopStyles ร่วมกับบัตรพรีออเดอร์ — ทุกหน้าหน้าตาเหมือนกัน
//   และวางใน productGrid ที่เดียวกัน บัตรจึงกว้างเท่ากัน · h-full = สูงเท่ากันทั้งแถว ราคา/ปุ่มชิดล่างตรงกัน
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Truck } from "lucide-react";
import { useLocalName } from "@/app/customer/lib/localName";
import { FaSpinner, FaCheck, FaStar, FaHeart, FaRegHeart } from "react-icons/fa";
import type { Product } from "@/types/product";
import { resolveUploadUrl } from "@/lib/uploads";
import { effectivePrice, hasSalePrice } from "@/lib/pricing";
import { useAddToCart } from "@/app/customer/hooks/useAddToCart";
import { useFavorites } from "@/app/customer/hooks/useFavorites";
import { useAllergenWarnings } from "@/app/customer/hooks/useAllergenWarnings";
import { useLocalOnlyShipping } from "@/app/customer/hooks/useLocalOnlyShipping";
import type { AllergenWarning, AllergenWarningLevel } from "@/services/catalog";
import ShopImage from "./ShopImage";
import {
  productCardBody,
  productCardButton,
  productCardFrame,
  productCardImage,
  productCardSubtitle,
  productCardTitle,
} from "./shopStyles";

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

/** ป้าย "ส่งเฉพาะ จ.หนองคาย" มุมซ้ายล่างของรูป — สินค้าที่ส่งนอกจังหวัดร้านไม่ได้ · สินค้าพรีออเดอร์ส่งได้ทุกจังหวัด = ไม่มีป้าย */
export function LocalOnlyBadge({
  productId,
  category,
  isPreorder = false,
}: {
  productId: string;
  category: Product["category_id"] | null;
  isPreorder?: boolean;
}) {
  const t = useTranslations("shop.productCard");
  const { isLocalOnly, province } = useLocalOnlyShipping();
  if (isPreorder || !isLocalOnly(productId, category)) return null;
  return (
    <span
      title={t("localOnlyHint", { province })}
      className="absolute bottom-2 left-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 truncate rounded-full border border-sky-200 bg-sky-50/95 px-2 py-0.5 text-[11px] font-semibold leading-4 text-sky-800 shadow-sm"
    >
      <Truck size={12} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{t("localOnly", { province })}</span>
    </span>
  );
}

export default function ProductCard({
  product,
  showAddToCart = true,
  showFavorite = true,
  allergenWarning: allergenWarningProp = null,
  priority = false,
}: {
  product: Product;
  showAddToCart?: boolean;
  showFavorite?: boolean;
  /** จากระบบแนะนำ (สินค้าคล้าย · แนะนำสำหรับคุณ) — มีเมื่อ login + บันทึกอาหารที่แพ้ไว้ */
  allergenWarning?: AllergenWarning | null;
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
  const reviewCount = product.review_count ?? 0;
  const favorite = favorites.isFavorite(product._id);
  const allergenWarning = allergenWarningProp ?? allergenWarningOf(product._id);
  const names = localNames(product.product_name_th, product.product_name_eng);

  return (
    <Link href={`/customer/product/${product._id}`} className={productCardFrame}>
      <div className={productCardImage}>
        {/* รูปที่โหลดไม่ขึ้น (ไฟล์หายจากเซิร์ฟเวอร์) → แสดง "ไม่มีรูปภาพ" แทนรูปแตก */}
        {imgSrc && imgSrc !== failedImg ? (
          <ShopImage
            src={imgSrc}
            alt={product.product_name_eng || product.product_name_th}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
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
        <LocalOnlyBadge productId={product._id} category={product.category_id ?? null} isPreorder={product.is_preorder} />
      </div>

      {/* ฟอนต์อิงฐาน 18px (globals.css html 112.5%) · ขั้นต่ำของแอป 16px = text-sm/text-xs · 17px = text-[0.9444rem] · 18px = text-base
          ชื่อ/ราคา โตตามจอ 16 → 17 (≥768) → 18 (≥1280) · ชื่อรอง/ปุ่ม คงที่ 16 (ขั้นต่ำ — ห้ามใช้ค่า px ที่เล็กกว่านี้)
          บน: ชื่อ + ชื่อรอง · ล่าง (mt-auto ชิดล่างเสมอ): ราคา | ดาว แถวเดียว แล้วปุ่ม */}
      <div className={productCardBody}>
        <div className="min-w-0">
          <h3 className={productCardTitle}>{names.primary}</h3>
          <p className={productCardSubtitle}>{names.secondary || " "}</p>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-end justify-between gap-2">
            {/* ราคา — กำลังลดราคา: ราคาลดสีแดง + ราคาเดิมขีดฆ่า (ไม่มีป้าย % — เอาออก 2026-10-26) */}
            {hasSalePrice(product) ? (
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
                <span className="text-sm md:text-[0.9444rem] xl:text-base font-extrabold text-red-600">
                  ฿{effectivePrice(product).toLocaleString()}
                </span>
                <span className="text-xs text-stone-500 line-through">฿{product.product_price?.toLocaleString()}</span>
              </div>
            ) : (
              <span className="text-sm md:text-[0.9444rem] xl:text-base font-extrabold text-[#8C5A3C]">
                ฿{product.product_price?.toLocaleString()}
              </span>
            )}

            <span className="flex shrink-0 items-center gap-1 pb-0.5 text-xs font-medium text-stone-700" title={t("reviews", { n: reviewCount })}>
              <FaStar className="text-amber-400" aria-hidden="true" />
              <span>{rating.toFixed(1)}</span>
              {reviewCount > 0 && <span className="text-stone-500">({reviewCount})</span>}
            </span>
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
              className={`${productCardButton} ${
                isSuccess ? "!border-emerald-600 !bg-emerald-600 !text-white" : ""
              } disabled:cursor-not-allowed disabled:opacity-75`}
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
