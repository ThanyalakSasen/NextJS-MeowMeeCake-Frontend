"use client";
// ─────────────────────────────────────────────────────────────
// บัตรสินค้าของหน้าร้าน — ย้ายมาจาก FrontOffice (components/customer/ProductCard.tsx)
// เปลี่ยนจากเดิม: ใช้ Product ของ backend หลัก (is_preorder แทน product_type) · รูปผ่าน resolveUploadUrl
// · คะแนนรีวิวแสดง avg_rating (เดิมแสดง review_count ผิดช่อง)
// ตัดออก (backend ยังไม่รองรับ): ปุ่มรายการโปรด · ป้ายสารก่อภูมิแพ้ · เหตุผลที่แนะนำ (recommendation engine)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { FaSpinner, FaCheck, FaStar } from "react-icons/fa";
import type { Product } from "@/types/product";
import { resolveUploadUrl } from "@/lib/uploads";
import { effectivePrice, hasSalePrice, salePercent } from "@/lib/pricing";
import { useAddToCart } from "@/app/customer/hooks/useAddToCart";

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

export default function ProductCard({ product, showAddToCart = true }: { product: Product; showAddToCart?: boolean }) {
  const { addToCart, status } = useAddToCart();
  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const [failedImg, setFailedImg] = useState<string | null>(null);

  if (!isProductCardVisible(product)) return null;

  const categoryName = categoryNameOf(product);
  const imgSrc = resolveUploadUrl(product.product_img?.[0]);
  const rating = Number(product.avg_rating ?? 0);

  return (
    <Link
      href={`/customer/product/${product._id}`}
      className="group block bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        {/* รูปที่โหลดไม่ขึ้น (ไฟล์หายจากเซิร์ฟเวอร์) → แสดง "ไม่มีรูปภาพ" แทนรูปแตก */}
        {imgSrc && imgSrc !== failedImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={product.product_name_eng || product.product_name_th}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setFailedImg(imgSrc)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-black text-xs font-medium">ไม่มีรูปภาพ</div>
        )}
      </div>

      <div className="p-5 sm:p-3 flex flex-col justify-between !bg-[#fff]">
        <div>
          <p className="text-md font-medium text-black mb-0.5 truncate">{categoryName || "หมวดหมู่ไม่ระบุ"}</p>
          <h3 className="text-lg font-semibold text-black line-clamp-1">{product.product_name_th}</h3>
          <p className="text-md text-black line-clamp-1 mb-2">{product.product_name_eng || " "}</p>
        </div>

        <div>
          <div className="flex items-end justify-between my-1">
            {/* ราคา — กำลังลดราคา: ราคาลดสีแดง + ราคาเดิมขีดฆ่า + ป้าย % */}
            {hasSalePrice(product) ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-red-600">฿</span>
                  <span className="text-lg font-extrabold text-red-600">{effectivePrice(product).toLocaleString()}</span>
                </span>
                <span className="text-xs text-stone-400 line-through">฿{product.product_price?.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-white bg-red-500 rounded px-1 py-0.5 leading-none">
                  -{salePercent(product)}%
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-[#8C5A3C]">฿</span>
                <span className="text-lg font-extrabold text-[#8C5A3C]">{product.product_price?.toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-black text-xs font-medium pb-0.5" title={`${product.review_count ?? 0} รีวิว`}>
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
                void addToCart(product._id, 1);
              }}
              className={`w-full py-1.5 px-2 mt-1 text-md font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1 ${
                isSuccess
                  ? "!bg-emerald-600 border border-emerald-600 !text-white shadow-md"
                  : "!bg-white !text-[#4A342E] border border-[#8C5A3C]/30 shadow-md shadow-[#4A342E]/20 hover:!bg-[#4A342E] hover:!text-white hover:shadow-lg active:scale-[0.98]"
              } disabled:opacity-75 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin text-xs" />
                  <span>กำลังเพิ่ม...</span>
                </>
              ) : isSuccess ? (
                <>
                  <FaCheck className="text-xs" />
                  <span>เพิ่มแล้ว</span>
                </>
              ) : (
                "เพิ่มลงตะกร้า"
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
