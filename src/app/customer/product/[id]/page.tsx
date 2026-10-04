"use client";
// ─────────────────────────────────────────────────────────────
// รายละเอียดสินค้า — ย้ายมาจาก FrontOffice (customer/product/[id]/ProductDetailClient.tsx)
// เปลี่ยนจากเดิม: ข้อมูลจาก /catalog/products/{id} + /catalog/products/{id}/reviews (backend หลัก) ฝั่ง client
// (FrontOffice เดิมเป็น Server Component + ISR — ทำ SEO ทีหลังได้ด้วย generateMetadata เมื่อ backend เป็น same-site)
// ตัดออก (backend ยังไม่รองรับ): รายการโปรด · แชร์รับแต้ม · สินค้าคล้ายกัน · ตัวเลือกสินค้า (variant — BACKLOG2 §6)
// · หมายเหตุต่อชิ้น (ตะกร้าไม่มีฟิลด์นี้) · รายการวัตถุดิบ · ตัวกรองรีวิวตามหัวข้อ/สื่อวิดีโอ · คำตอบจากร้าน
// สินค้าพรีออเดอร์: ไม่เข้าตะกร้าปกติ — แจ้งให้สั่งผ่านหน้าพรีออเดอร์ (ย้ายมาในช่วงถัดไป)
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FaImage } from "react-icons/fa";
import { catalogService, type CatalogReview } from "@/services/catalog";
import { resolveUploadUrl } from "@/lib/uploads";
import { effectivePrice, hasSalePrice, salePercent } from "@/lib/pricing";
import { isApiError } from "@/types/api";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { useAddToCart } from "../../hooks/useAddToCart";

const isObjectId = (id: string) => /^[0-9a-f]{24}$/i.test(id);

/** ปิดชื่อผู้รีวิวบางส่วน (backend ส่งชื่อเต็มมา) — "สมชาย ใจดี" → "ส***ย" */
function maskName(name: string | undefined): string {
  const n = (name ?? "").trim();
  if (n.length <= 1) return n ? `${n}***` : "ลูกค้า";
  return `${n[0]}***${n[n.length - 1]}`;
}

function reviewerName(r: CatalogReview): string {
  return maskName(typeof r.user_id === "object" && r.user_id ? r.user_id.user_fullname : undefined);
}

const reviewFilterCls = (active: boolean) =>
  `py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
    active ? "bg-[#4A342E] text-white border-[#4A342E]" : "bg-white text-[#4A342E] border-[#8C5A3C]/20 hover:bg-[#8C5A3C]/10"
  }`;

type ReviewFilter = "all" | 1 | 2 | 3 | 4 | 5 | "media";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const validId = isObjectId(id ?? "");

  const productQ = useQuery({
    queryKey: ["catalog", "product", id],
    queryFn: () => catalogService.product(id),
    enabled: validId,
    retry: (count, e) => !(isApiError(e) && e.status === 404) && count < 2,
  });
  const reviewsQ = useQuery({
    queryKey: ["catalog", "product", id, "reviews"],
    queryFn: () => catalogService.reviews(id),
    enabled: validId && productQ.isSuccess,
  });

  const { addToCart, status } = useAddToCart();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "heating">("description");
  const [slideIndex, setSlideIndex] = useState(0);
  const [slidePaused, setSlidePaused] = useState(false);
  const [filter, setFilter] = useState<ReviewFilter>("all");

  const product = productQ.data;
  const images = useMemo(
    () => (product?.product_img ?? []).map((u) => resolveUploadUrl(u)).filter((u): u is string => !!u),
    [product],
  );

  // สไลด์รูปอัตโนมัติทุก 4 วินาที (หยุดตอนเอาเมาส์ชี้)
  useEffect(() => {
    if (images.length <= 1 || slidePaused) return;
    const t = setInterval(() => setSlideIndex((i) => (i + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length, slidePaused]);

  const reviews = useMemo(() => reviewsQ.data ?? [], [reviewsQ.data]);
  const filteredReviews = useMemo(() => {
    if (filter === "all") return reviews;
    if (filter === "media") return reviews.filter((r) => (r.image?.length ?? 0) > 0);
    return reviews.filter((r) => Math.round(Number(r.rating)) === filter);
  }, [reviews, filter]);

  if (!validId || (productQ.isError && isApiError(productQ.error) && productQ.error.status === 404)) {
    return (
      <div className="w-full min-h-screen pt-52 pb-16 text-center text-[#4A342E]">
        <p className="text-lg font-bold">ไม่พบสินค้านี้</p>
        <button
          type="button"
          onClick={() => router.push("/customer/product")}
          className="mt-4 px-5 py-2 rounded-xl border border-[#8C5A3C]/30 bg-white font-semibold hover:bg-[#4A342E] hover:text-white transition"
        >
          ดูสินค้าทั้งหมด
        </button>
      </div>
    );
  }

  if (productQ.isLoading || !product) {
    return (
      <div className="w-full min-h-screen pt-52 pb-16 text-center">
        {productQ.isError ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-gray-600">โหลดข้อมูลสินค้าไม่สำเร็จ</p>
            <button
              type="button"
              onClick={() => productQ.refetch()}
              className="px-5 py-2 rounded-xl border border-[#8C5A3C]/30 bg-white font-semibold text-[#4A342E] hover:bg-[#4A342E] hover:text-white transition"
            >
              ลองใหม่
            </button>
          </div>
        ) : (
          <p className="text-[#8C5A3C] font-medium animate-pulse">กำลังโหลดสินค้า...</p>
        )}
      </div>
    );
  }

  const stock = product.product_stock_quantity ?? 0;
  const isPreorder = product.is_preorder;
  const outOfStock = !isPreorder && stock <= 0;
  const price = effectivePrice(product);
  const discounted = hasSalePrice(product);
  const unitName = typeof product.unit_id === "object" && product.unit_id ? product.unit_id.unit_name : "";
  const rating = Number(product.avg_rating ?? 0);
  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const changeQty = (d: number) => setQty((q) => Math.min(Math.max(1, q + d), Math.max(1, stock)));

  return (
    <div className="w-full min-h-screen text-[#4A342E] pt-46 sm:pt-50 md:pt-44 pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        <div>
          <CustomerBreadcrumb items={[{ label: "สินค้าทั้งหมด", href: "/customer/product" }, { label: product.product_name_th }]} />
          {/* เปิดจากลิงก์ตรง (ไม่มีหน้าก่อนหน้า) → กลับไปหน้าสินค้าทั้งหมดแทน */}
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/customer/product"))}
            className="-mt-2 px-3.5 py-1.5 text-xs bg-white border border-[#8C5A3C]/30 text-[#4A342E] font-bold rounded-xl shadow-md shadow-[#4A342E]/20 hover:bg-[#4A342E] hover:text-white hover:shadow-lg active:scale-[0.98] transition-all duration-200"
          >
            ← ย้อนกลับ
          </button>
        </div>

        {/* ข้อมูลหลักสินค้า */}
        <div className="bg-white rounded-xl p-6 sm:p-8 lg:p-10 shadow-sm border border-[#8C5A3C]/10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          <div className="w-full lg:w-[400px] shrink-0 flex flex-col items-center">
            <div
              className="w-full max-w-[360px] aspect-square rounded-xl overflow-hidden bg-[#FAF6F0] border border-[#8C5A3C]/10 flex items-center justify-center relative shadow-inner"
              onMouseEnter={() => setSlidePaused(true)}
              onMouseLeave={() => setSlidePaused(false)}
            >
              {images.length > 0 ? (
                <div
                  className="flex w-full h-full transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${slideIndex * 100}%)` }}
                >
                  {images.map((img, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={img} alt={product.product_name_eng || product.product_name_th} className="w-full h-full object-cover shrink-0" />
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-500">ไม่มีรูปภาพ</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="w-full max-w-[360px] flex items-center gap-2 mt-3 overflow-x-auto py-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSlideIndex(idx)}
                    aria-label={`รูปที่ ${idx + 1}`}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      slideIndex === idx ? "border-[#8C5A3C] shadow-sm scale-95" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-full flex-1 flex flex-col gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4A342E] leading-tight">{product.product_name_th}</h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">{product.product_name_eng}</p>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#4A342E]">
              <span>คะแนน:</span>
              <span className="text-[#8C5A3C] font-bold">{rating.toFixed(1)}</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500 font-normal">{product.review_count || 0} รีวิว</span>
            </div>

            <div className="bg-[#FAF6F0]/80 p-4 rounded-xl border border-[#8C5A3C]/10 flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-medium text-gray-600">ราคา :</span>
              <span className={`text-3xl font-black ${discounted ? "text-red-600" : "text-[#8C5A3C]"}`}>{price.toLocaleString("th-TH")}</span>
              <span className="text-xl font-semibold text-gray-600">บาท {unitName ? `/ ${unitName}` : ""}</span>
              {discounted && (
                <>
                  <span className="text-base text-gray-400 line-through">{product.product_price.toLocaleString("th-TH")} บาท</span>
                  <span className="ml-auto text-xs font-bold text-white bg-red-500 px-2.5 py-1 rounded-xl">ลดราคา -{salePercent(product)}%</span>
                </>
              )}
            </div>

            {isPreorder ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                สินค้านี้เป็นสินค้าพรีออเดอร์ สั่งได้ผ่านรอบพรีออเดอร์เท่านั้น
              </p>
            ) : (
              <>
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center border border-[#8C5A3C]/30 rounded-xl overflow-hidden bg-white shrink-0">
                    <button
                      type="button"
                      onClick={() => changeQty(-1)}
                      disabled={isLoading || outOfStock || qty <= 1}
                      aria-label="ลดจำนวน"
                      className="w-10 h-11 flex items-center justify-center font-bold text-lg text-[#8C5A3C] hover:bg-[#8C5A3C]/10 disabled:opacity-40 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-bold text-sm sm:text-base text-[#4A342E]">{qty}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(1)}
                      disabled={isLoading || outOfStock || qty >= stock}
                      aria-label="เพิ่มจำนวน"
                      className="w-10 h-11 flex items-center justify-center font-bold text-lg text-[#8C5A3C] hover:bg-[#8C5A3C]/10 disabled:opacity-40 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading || isSuccess || outOfStock}
                    onClick={() => void addToCart(product._id, qty)}
                    className="flex-1 h-11 px-2 text-sm sm:text-base bg-white border border-[#8C5A3C]/30 text-[#4A342E] font-bold rounded-xl shadow-md shadow-[#4A342E]/20 hover:bg-[#4A342E] hover:text-white hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {outOfStock ? "สินค้าหมด" : isLoading ? "กำลังเพิ่ม..." : isSuccess ? "เพิ่มแล้ว" : "เพิ่มลงตะกร้า"}
                  </button>
                </div>
                {!outOfStock && <p className="-mt-2 text-xs text-gray-500">คงเหลือ {stock.toLocaleString("th-TH")} ชิ้น</p>}
              </>
            )}

            <div className="flex gap-2 pt-4">
              {(
                [
                  ["description", "ดูรายละเอียด"],
                  ["heating", "ขั้นตอนการอุ่น"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  aria-pressed={activeTab === key}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                    activeTab === key
                      ? "bg-[#4A342E] text-white border-[#8C5A3C] shadow-sm"
                      : "bg-white text-[#4A342E] border-[#8C5A3C]/20 hover:bg-[#4A342E] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="bg-[#FAF6F0] p-5 rounded-xl border border-[#8C5A3C]/10">
              <h4 className="text-xs font-bold text-[#8C5A3C] uppercase tracking-wider mb-1">
                {activeTab === "description" ? "รายละเอียดสินค้า" : "ขั้นตอนการอุ่น"}
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {activeTab === "description"
                  ? product.product_description || "ไม่มีข้อมูลรายละเอียดสินค้า"
                  : product.preparation_heating || "ไม่มีข้อมูลขั้นตอนการอุ่น"}
              </p>
            </div>
          </div>
        </div>

        {/* รีวิวลูกค้า */}
        <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-[#8C5A3C]/10 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <h2 className="text-lg sm:text-xl font-bold text-[#4A342E]">รีวิวจากคุณลูกค้า ({product.review_count || 0} รีวิว)</h2>
            <div className="flex items-center gap-1.5 text-[#4A342E]">
              <span className="text-xs font-medium">คะแนนเฉลี่ย:</span>
              <span className="text-xl font-black text-[#8C5A3C]">{rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={`px-3.5 ${reviewFilterCls(filter === "all")}`}>
              ทั้งหมด
            </button>
            {([5, 4, 3, 2, 1] as const).map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFilter(star)}
                aria-pressed={filter === star}
                className={`px-3.5 ${reviewFilterCls(filter === star)}`}
              >
                {star} ดาว
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFilter("media")}
              aria-pressed={filter === "media"}
              className={`flex items-center gap-1.5 px-3.5 ${reviewFilterCls(filter === "media")}`}
            >
              <FaImage />
              <span>มีรูปภาพ</span>
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {reviewsQ.isLoading ? (
              <p className="text-center py-8 text-sm text-[#8C5A3C] animate-pulse">กำลังโหลดรีวิว...</p>
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map((r) => {
                const name = reviewerName(r);
                const photos = (r.image ?? []).map((u) => resolveUploadUrl(u)).filter((u): u is string => !!u);
                return (
                  <div key={r._id} className="p-4 sm:p-5 rounded-xl bg-gray-50/60 border border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#8C5A3C] text-white flex items-center justify-center font-bold text-sm" aria-hidden="true">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-[#4A342E]">{name}</span>
                          <div className="text-xs font-semibold text-[#8C5A3C]">คะแนน: {Number(r.rating || 0).toFixed(1)}</div>
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleDateString("th-TH") : ""}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 sm:pl-12">{r.review_text || "ไม่มีความเห็นเพิ่มเติม"}</p>
                    {photos.length > 0 && (
                      <div className="flex flex-wrap gap-2 sm:pl-12 pt-1">
                        {photos.map((url, idx) => (
                          <div key={idx} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-gray-200 bg-black/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`รูปจากรีวิว ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm font-bold text-[#4A342E]">{reviews.length ? "ไม่พบรีวิวในตัวกรองนี้" : "ยังไม่มีรีวิว"}</p>
                {reviews.length > 0 && <span className="text-xs text-gray-400 block mt-1">ลองเลือกตัวกรองอื่นเพื่อดูรีวิวเพิ่มเติม</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
