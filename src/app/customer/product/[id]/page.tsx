"use client";
// ─────────────────────────────────────────────────────────────
// รายละเอียดสินค้า (BACKLOG3-merge C1) — ยกจาก FrontOffice customer/product/[id]/ProductDetailClient.tsx
// API: /catalog/products/{id} · /customization (ตัวเลือก) · /reviews (+summary) · /sentiment · /similar
//      ตะกร้า POST /shop/cart/items { variant_ids, selected_options } · แชร์ POST /shop/points/share
// (FrontOffice เดิมเป็น Server Component + ISR — ทำ SEO ทีหลังได้ด้วย generateMetadata เมื่อ backend เป็น same-site)
// พรีออเดอร์ (D3): ?round=<id> → ราคาของรอบ + เพิ่มลงรายการพรีออเดอร์ (_components/PreorderOrderBox)
// ยังไม่ยกมา: หมายเหตุต่อชิ้นของสินค้าปกติ (ตะกร้าไม่มีฟิลด์นี้ — ใช้ออปชันกรอกข้อความแทน)
// · รายการส่วนประกอบ (/catalog/products/{id} ไม่ส่งวัตถุดิบ — มีแค่ในผลของระบบแนะนำ)
// ─────────────────────────────────────────────────────────────
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import { FaHeart, FaRegHeart, FaShareAlt, FaSpinner } from "react-icons/fa";
import { catalogService } from "@/services/catalog";
import { shopLoyaltyService } from "@/services/shopLoyalty";
import { resolveUploadUrl } from "@/lib/uploads";
import { effectivePrice, hasSalePrice } from "@/lib/pricing";
import { checkPicked, hasCustomization, initialPicked, toSelection, type Picked } from "@/lib/customizationSelection";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { useAddToCart } from "../../hooks/useAddToCart";
import { useFavorites } from "../../hooks/useFavorites";
import { catalogProductKey, productCustomizationKey } from "../../lib/catalogQueries";
import { preorderRoundKey, shopPointsKey } from "../../lib/shopQueries";
import { shopPreordersService } from "@/services/shopPreorders";
import PreorderOrderBox from "./_components/PreorderOrderBox";
import CustomizationPicker from "./_components/CustomizationPicker";
import { pickProblemText } from "../../lib/pickProblemText";
import ReviewsSection from "./_components/ReviewsSection";
import SimilarProducts from "./_components/SimilarProducts";

const isObjectId = (id: string) => /^[0-9a-f]{24}$/i.test(id);

const iconButton =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#8C5A3C]/20 bg-white shadow-sm transition hover:scale-105 hover:bg-[#FAF6F0] disabled:opacity-60";

export default function ProductDetailPage() {
  return (
    // useSearchParams (?round=) ต้องอยู่ใต้ Suspense (ไม่งั้น next build error)
    <Suspense fallback={null}>
      <ProductDetailContent />
    </Suspense>
  );
}

function ProductDetailContent() {
  const t = useTranslations("shop.product");
  const tpick = useTranslations("shop.pick");
  const tcard = useTranslations("shop.productCard");
  const tcart = useTranslations("shop.cart");
  const tp = useTranslations("shop.products");
  const { name: localName, names: localNames } = useLocalName();
  const { id } = useParams<{ id: string }>();
  const roundParam = useSearchParams().get("round");
  const router = useRouter();
  const qc = useQueryClient();
  const validId = isObjectId(id ?? "");
  const validRound = !!roundParam && isObjectId(roundParam);
  const { status: authStatus } = useCustomerSession();

  const productQ = useQuery({
    queryKey: catalogProductKey(id),
    queryFn: () => catalogService.product(id),
    enabled: validId,
    retry: (count, e) => !(isApiError(e) && e.status === 404) && count < 2,
  });
  const customQ = useQuery({
    queryKey: productCustomizationKey(id),
    queryFn: () => catalogService.customization(id),
    enabled: validId && productQ.isSuccess,
    staleTime: 5 * 60_000,
  });
  // โหมดพรีออเดอร์ (D3): เปิดจากหน้ารอบ ?round= → ราคา/โควตาของรอบ
  const roundQ = useQuery({
    queryKey: preorderRoundKey(roundParam ?? ""),
    queryFn: () => shopPreordersService.round(roundParam!),
    enabled: validRound && productQ.data?.is_preorder === true,
    retry: (count, e) => !(isApiError(e) && e.status === 404) && count < 2,
  });

  const { addToCart, status } = useAddToCart();
  const favorites = useFavorites();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "heating">("description");
  const [slideIndex, setSlideIndex] = useState(0);
  const [slidePaused, setSlidePaused] = useState(false);
  // ตัวเลือกที่ลูกค้าเลือก · null = ยังไม่แตะ (ใช้ค่าตั้งต้นจาก initialPicked)
  const [pickedState, setPicked] = useState<Picked | null>(null);
  const [showProblems, setShowProblems] = useState(false);
  const [sharing, setSharing] = useState(false);

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

  if (!validId || (productQ.isError && isApiError(productQ.error) && productQ.error.status === 404)) {
    return (
      <div className="w-full min-h-screen pt-52 pb-16 text-center text-[#4A342E]">
        <p className="text-lg font-bold">{t("notFound")}</p>
        <button
          type="button"
          onClick={() => router.push("/customer/product")}
          className="mt-4 px-5 py-2 rounded-xl border border-[#8C5A3C]/30 bg-white font-semibold hover:bg-[#4A342E] hover:text-white transition"
        >
          {t("seeAll")}
        </button>
      </div>
    );
  }

  if (productQ.isLoading || !product) {
    return (
      <div className="w-full min-h-screen pt-52 pb-16 text-center">
        {productQ.isError ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-gray-600">{t("loadFailed")}</p>
            <button
              type="button"
              onClick={() => productQ.refetch()}
              className="px-5 py-2 rounded-xl border border-[#8C5A3C]/30 bg-white font-semibold text-[#4A342E] hover:bg-[#4A342E] hover:text-white transition"
            >
              {t("retry")}
            </button>
          </div>
        ) : (
          <p className="text-[#8C5A3C] font-medium animate-pulse">{t("loading")}</p>
        )}
      </div>
    );
  }

  const stock = product.product_stock_quantity ?? 0;
  const isPreorder = product.is_preorder;
  const outOfStock = !isPreorder && stock <= 0;
  const customization = customQ.data;
  const customizable = hasCustomization(customization);
  const picked = pickedState ?? (customization ? initialPicked(customization) : { variantIds: [], options: {} });
  const problems = customization && customizable ? checkPicked(customization, picked) : [];
  const selection = customization && customizable ? toSelection(customization, picked) : null;
  const extra = selection?.extra ?? 0;
  const roundItem = isPreorder ? roundQ.data?.items.find((it) => it.product._id === product._id) : undefined;
  // พรีออเดอร์ในรอบ = ราคาของรอบ (price_override หรือราคาขายจริง) · ไม่ใช่ราคาหน้าร้าน
  const price = (roundItem ? roundItem.current_price : effectivePrice(product)) + extra;
  const discounted = roundItem ? roundItem.current_price < effectivePrice(product) : hasSalePrice(product);
  // ราคาที่ขีดฆ่า: พรีออเดอร์ = ราคาขายจริงหน้าร้าน · ปกติ = ราคาเต็มก่อนลด
  const regularPrice = roundItem ? effectivePrice(product) : product.product_price;
  const unitName = typeof product.unit_id === "object" && product.unit_id ? product.unit_id.unit_name : "";
  const rating = Number(product.avg_rating ?? 0);
  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const changeQty = (d: number) => setQty((q) => Math.min(Math.max(1, q + d), Math.max(1, stock)));
  const favorite = favorites.isFavorite(product._id);

  const onAdd = async () => {
    if (customQ.isLoading) return;
    if (problems.length > 0) {
      setShowProblems(true);
      alert.warning(pickProblemText(problems[0], tpick));
      return;
    }
    const ok = await addToCart(product._id, qty, {
      variant_ids: selection?.variantIds ?? [],
      selected_options: (selection?.options ?? []).map((o) => ({ option_id: o.option_id, text_value: o.text_value })),
    });
    if (ok) setShowProblems(false);
  };

  // แชร์ลิงก์สินค้า (share sheet ของมือถือ หรือคัดลอกลิงก์) — สมาชิกได้แต้มครั้งเดียวต่อสินค้า
  const onShare = async () => {
    const url = window.location.href;
    const canNativeShare = typeof navigator.share === "function";
    try {
      if (canNativeShare) await navigator.share({ title: localName(product.product_name_th, product.product_name_eng), url });
      else await navigator.clipboard.writeText(url);
    } catch {
      return; // กดยกเลิกหน้าต่างแชร์ = ไม่ถือว่าแชร์
    }
    let awarded = 0;
    if (authStatus === "authenticated") {
      setSharing(true);
      // ให้แต้มไม่สำเร็จ → ยังแชร์ได้ แค่ไม่ได้แต้ม
      awarded = await shopLoyaltyService.share(product._id).catch(() => 0);
      setSharing(false);
      if (awarded > 0) void qc.invalidateQueries({ queryKey: shopPointsKey });
    }
    const done = canNativeShare ? t("shared") : t("copied");
    alert.success(awarded > 0 ? t("sharedPoints", { done, n: awarded }) : done);
  };

  return (
    <div className="w-full min-h-screen text-[#4A342E] pt-46 sm:pt-50 md:pt-44 pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        <div>
          <CustomerBreadcrumb items={[{ label: tp("allProducts"), href: "/customer/product" }, { label: localName(product.product_name_th, product.product_name_eng) }]} />
          {/* เปิดจากลิงก์ตรง (ไม่มีหน้าก่อนหน้า) → กลับไปหน้าสินค้าทั้งหมดแทน */}
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/customer/product"))}
            className="-mt-2 px-3.5 py-1.5 text-xs bg-white border border-[#8C5A3C]/30 text-[#4A342E] font-bold rounded-xl shadow-md shadow-[#4A342E]/20 hover:bg-[#4A342E] hover:text-white hover:shadow-lg active:scale-[0.98] transition-all duration-200"
          >
            {t("back")}
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
                <span className="text-sm text-gray-500">{t("noImage")}</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="w-full max-w-[360px] flex items-center gap-2 mt-3 overflow-x-auto py-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSlideIndex(idx)}
                    aria-label={t("imageN", { n: idx + 1 })}
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
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4A342E] leading-tight">{localNames(product.product_name_th, product.product_name_eng).primary}</h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">{localNames(product.product_name_th, product.product_name_eng).secondary}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void onShare()}
                  disabled={sharing}
                  aria-label={t("share")}
                  title={t("shareHint")}
                  className={iconButton}
                >
                  {sharing ? <FaSpinner className="animate-spin text-sm text-gray-500" /> : <FaShareAlt className="text-sm text-[#8C5A3C]" />}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void favorites.toggle(product._id, {
                      name: product.product_name_th,
                      nameeg: product.product_name_eng ?? "",
                      price: effectivePrice(product),
                      image: product.product_img?.[0] ?? "",
                      is_preorder: !!product.is_preorder,
                    })
                  }
                  disabled={favorites.pendingId === product._id}
                  aria-pressed={favorite}
                  aria-label={favorite ? tcard("removeFavorite") : tcard("addFavorite")}
                  title={favorite ? tcard("removeFavorite") : tcard("addFavorite")}
                  className={iconButton}
                >
                  {favorites.pendingId === product._id ? (
                    <FaSpinner className="animate-spin text-sm text-gray-500" />
                  ) : favorite ? (
                    <FaHeart className="text-base text-red-500" />
                  ) : (
                    <FaRegHeart className="text-base text-black" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#4A342E]">
              <span>{t("rating")}</span>
              <span className="text-[#8C5A3C] font-bold">{rating.toFixed(1)}</span>
              <span className="text-gray-500">|</span>
              <a href="#reviews-title" className="text-gray-500 font-normal hover:underline">{t("reviews", { n: product.review_count || 0 })}</a>
            </div>

            <div className="bg-[#FAF6F0]/80 p-4 rounded-xl border border-[#8C5A3C]/10 flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-medium text-gray-600">{t("price")}</span>
              <span className={`text-3xl font-black ${discounted ? "text-red-600" : "text-[#8C5A3C]"}`}>{price.toLocaleString()}</span>
              <span className="text-xl font-semibold text-gray-600">{unitName ? t("perUnit", { unit: unitName }) : t("baht")}</span>
              {discounted && (
                <>
                  <span className="text-base text-gray-500 line-through">{t("regularPrice", { price: (regularPrice + extra).toLocaleString() })}</span>
                  <span className="ml-auto text-xs font-bold text-white bg-red-500 px-2.5 py-1 rounded-xl">{t("sale", { percent: Math.round((1 - (price - extra) / regularPrice) * 100) })}</span>
                </>
              )}
              {extra > 0 && <span className="w-full text-xs text-gray-500">{t("withOptions", { n: extra.toLocaleString() })}</span>}
            </div>

            {isPreorder ? (
              <PreorderOrderBox
                productId={product._id}
                productName={product.product_name_th}
                productImg={product.product_img?.[0] ?? ""}
                hasRoundParam={validRound}
                round={roundQ.data}
                roundItem={roundItem}
                loading={roundQ.isLoading || customQ.isLoading}
                customization={customization && customizable ? customization : null}
                picked={picked}
                onPick={setPicked}
                problems={problems}
                selection={selection}
              />
            ) : (
              <>
                {customQ.isLoading ? (
                  <p className="text-xs text-gray-500 animate-pulse">{t("loadingOptions")}</p>
                ) : customization && customizable ? (
                  <CustomizationPicker
                    customization={customization}
                    picked={picked}
                    onChange={setPicked}
                    disabled={isLoading || outOfStock}
                  />
                ) : null}
                {showProblems && problems.length > 0 && (
                  <ul className="-mt-2 m-0 list-none space-y-0.5 p-0 text-xs text-red-600" role="alert">
                    {problems.map((p) => (
                      <li key={`${p.key}-${JSON.stringify(p.params)}`}>{pickProblemText(p, tpick)}</li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center border border-[#8C5A3C]/30 rounded-xl overflow-hidden bg-white shrink-0">
                    <button
                      type="button"
                      onClick={() => changeQty(-1)}
                      disabled={isLoading || outOfStock || qty <= 1}
                      aria-label={tcart("decrease")}
                      className="w-10 h-11 flex items-center justify-center font-bold text-lg text-[#8C5A3C] hover:bg-[#8C5A3C]/10 disabled:opacity-40 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-bold text-sm sm:text-base text-[#4A342E]">{qty}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(1)}
                      disabled={isLoading || outOfStock || qty >= stock}
                      aria-label={tcart("increase")}
                      className="w-10 h-11 flex items-center justify-center font-bold text-lg text-[#8C5A3C] hover:bg-[#8C5A3C]/10 disabled:opacity-40 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading || isSuccess || outOfStock || customQ.isLoading}
                    onClick={() => void onAdd()}
                    className="flex-1 h-11 px-2 text-sm sm:text-base bg-white border border-[#8C5A3C]/30 text-[#4A342E] font-bold rounded-xl shadow-md shadow-[#4A342E]/20 hover:bg-[#4A342E] hover:text-white hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {outOfStock
                      ? t("soldOut")
                      : isLoading
                        ? tcard("adding")
                        : isSuccess
                          ? tcard("added")
                          : t("addToCartPrice", { price: (price * qty).toLocaleString() })}
                  </button>
                </div>
                {!outOfStock && <p className="-mt-2 text-xs text-gray-500">{t("stockLeft", { n: stock.toLocaleString() })}</p>}
              </>
            )}

            <div className="flex gap-2 pt-4">
              {(
                [
                  ["description", t("tabDescription")],
                  ["heating", t("tabHeating")],
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
                {activeTab === "description" ? t("descriptionTitle") : t("tabHeating")}
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {activeTab === "description"
                  ? product.product_description || t("noDescription")
                  : product.preparation_heating || t("noHeating")}
              </p>
            </div>
          </div>
        </div>

        <ReviewsSection productId={product._id} />

        {/* สินค้าพรีออเดอร์ไม่แสดงสินค้าคล้ายกัน (เหมือนต้นแบบ) */}
        {!isPreorder && <SimilarProducts productId={product._id} />}
      </div>
    </div>
  );
}
