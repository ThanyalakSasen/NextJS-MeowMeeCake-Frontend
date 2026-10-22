"use client";
// ─────────────────────────────────────────────────────────────
// ตะกร้าสินค้า — แทน FrontOffice customer/cart/page.tsx (เขียนใหม่บน /shop/cart ของ backend หลัก)
// แก้จำนวน = PATCH /shop/cart/items/{id} (backend ตรวจสต็อกแล้วตอบข้อความเอง) · ลบ = DELETE
// ตัดออก (backend ยังไม่รองรับ): แพ็กเกจ/เซ็ตขนม · ตัวเลือกสินค้าหลายตัว · หมายเหตุต่อชิ้น
// รายการที่ซื้อไม่ได้ (ปิดขาย · หมด · สต็อกไม่พอ — สต็อกจาก /catalog/products/:id) แสดงต่อบรรทัด + ปิดปุ่มสั่งซื้อ (U6 · lib/cartIssues)
// backend ตรวจซ้ำตอนกดสั่งซื้อเสมอ · ช่องค้นหาอยู่ใน Navbar หน้าร้านแล้ว (FrontOffice ซ่อน Navbar ในตะกร้าเลยมีช่องแยก)
// พรีออเดอร์ที่ยังไม่ยืนยัน (localStorage · preorderBasket): มีสินค้าปกติ = ไม่แสดงอะไรเกี่ยวกับพรีออเดอร์เลย (สินค้าปกติมาก่อน)
//   ไม่มีสินค้าปกติ = แสดงส่วนพรีออเดอร์ (ปกติปุ่มตะกร้าบน Navbar พาไปหน้ายืนยันพรีออเดอร์โดยตรงอยู่แล้ว)
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import { FaImage, FaTrashAlt } from "react-icons/fa";
import { cartItemOptionText, shopCartService, type ShopCart, type ShopCartItem } from "@/services/shopCart";
import { resolveUploadUrl } from "@/lib/uploads";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { catalogService } from "@/services/catalog";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { baht, shopButton, shopButtonPrimary, shopCard, shopPage } from "@/components/customer/shopStyles";
import { useCartCountStore } from "../store/cartCountStore";
import { shopCartKey } from "../lib/shopQueries";
import { catalogProductKey } from "../lib/catalogQueries";
import { cartIssueText, cartIssues, cartProductId, type StockInfo } from "../lib/cartIssues";
import { useProvinceOnlyShipping } from "../hooks/useProvinceOnlyShipping";
import { FaTruck } from "react-icons/fa";
import FlowSteps from "@/components/customer/FlowSteps";
import ShopImage from "@/components/customer/ShopImage";
import { CalendarCheck } from "lucide-react";
import { usePreorderBasket, type PreorderBasket } from "../preorder/lib/preorderBasket";
import { thaiDate } from "../preorder/lib/preorderDates";

export default function CartPage() {
  const t = useTranslations("shop.cart");
  return (
    <CustomerAuthGate message={t("loginToView")}>
      <CartContent />
    </CustomerAuthGate>
  );
}

const productOf = (item: ShopCartItem) => (typeof item.product_id === "object" && item.product_id ? item.product_id : null);

function CartContent() {
  const t = useTranslations("shop.cart");
  const { name: localName } = useLocalName();
  const tc = useTranslations("shop.common");
  const qc = useQueryClient();
  const setCount = useCartCountStore((s) => s.setCount);
  // สินค้าที่ส่งได้เฉพาะในจังหวัดร้าน — แจ้งไว้ก่อนถึงหน้า checkout (ส่งนอกจังหวัดไม่ได้ · รับเองได้)
  const shipping = useProvinceOnlyShipping();
  // พรีออเดอร์ที่ยังไม่ยืนยัน — แสดงเป็นอีกส่วน (ชำระคนละบิล)
  const preorderBasket = usePreorderBasket();

  const cartQ = useQuery({
    queryKey: shopCartKey,
    queryFn: async () => {
      const cart = await shopCartService.get();
      setCount(cart.summary.item_count);
      return cart;
    },
  });

  // สต็อกปัจจุบันของสินค้าในตะกร้า — cache เดียวกับหน้ารายละเอียดสินค้า · 404 = ถูกซ่อน/ลบ
  const productIds = [...new Set((cartQ.data?.items ?? []).map(cartProductId).filter((x): x is string => !!x))];
  const stockQs = useQueries({
    queries: productIds.map((id) => ({
      queryKey: catalogProductKey(id),
      queryFn: () => catalogService.product(id),
      retry: (n: number, e: unknown) => !(isApiError(e) && e.status === 404) && n < 1,
      staleTime: 30_000,
    })),
  });
  const stockOf = (id: string): StockInfo => {
    const q = stockQs[productIds.indexOf(id)];
    if (!q) return null;
    if (q.isError) return isApiError(q.error) && q.error.status === 404 ? "missing" : null;
    return q.data ? { stock: q.data.product_stock_quantity } : null;
  };

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: shopCartKey });
    // จำนวนเปลี่ยน → สต็อกล่าสุดด้วย (ข้อความ "สต็อกไม่พอ" คิดจากทั้งตะกร้า)
    for (const id of productIds) void qc.invalidateQueries({ queryKey: catalogProductKey(id) });
  };

  const qtyMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => shopCartService.updateQuantity(id, qty),
    onSuccess: refresh,
    onError: (e) => alert.error(isApiError(e) ? e.message : t("qtyFailed")),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => shopCartService.removeItem(id),
    // ไม่แจ้งเตือนเมื่อสำเร็จ — รายการหายจากตะกร้าให้เห็นเอง
    onSuccess: refresh,
    onError: (e) => alert.error(isApiError(e) ? e.message : t("removeFailed")),
  });

  const busyId = qtyMutation.isPending
    ? qtyMutation.variables?.id
    : removeMutation.isPending
      ? removeMutation.variables
      : undefined;

  if (cartQ.isLoading) {
    return (
      <div className={`${shopPage} flex items-center justify-center`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8C5A3C]/20 border-t-[#8C5A3C]" aria-label={tc("loading")} />
      </div>
    );
  }

  if (cartQ.isError || !cartQ.data) {
    return (
      <div className={`${shopPage} flex items-center justify-center px-4`}>
        <div className={`${shopCard} max-w-md space-y-4 text-center`}>
          <p className="font-semibold text-red-700">{t("loadFailed")}</p>
          <button type="button" onClick={() => void cartQ.refetch()} className={shopButton}>
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  const cart: ShopCart = cartQ.data;
  const issues = cartIssues(cart.items, stockOf);
  const hasCart = cart.items.length > 0;

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px]">
        <CustomerBreadcrumb items={[{ label: t("title") }]} className="!mb-0" />
        {hasCart && <FlowSteps kind="order" current={1} />}

        {!hasCart && preorderBasket ? (
          <>
            <h1 className="m-0 text-xl font-bold">{t("title")}</h1>
            <PreorderCartSection basket={preorderBasket} />
            <p className="m-0 text-center text-sm text-gray-500">
              {t("emptyNormal")}{" "}
              <Link href="/customer/product" className="font-semibold text-[#8C5A3C] hover:text-[#4A342E]">{t("browse")}</Link>
            </p>
          </>
        ) : !hasCart ? (
          <div className={`${shopCard} mx-auto w-full max-w-md space-y-4 text-center`}>
            <h2 className="text-lg font-bold">{t("empty")}</h2>
            <Link href="/customer/product" className={`${shopButtonPrimary} w-full`}>
              {t("browse")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">
                  {t("title")} <span className="text-sm font-medium text-gray-500">{t("itemCount", { n: cart.items.length })}</span>
                </h1>
                <Link href="/customer/product" className="text-sm font-semibold text-[#8C5A3C] hover:text-[#4A342E]">
                  {t("continueShopping")}
                </Link>
              </div>

              {cart.items.map((item) => {
                const product = productOf(item);
                const img = resolveUploadUrl(product?.product_img?.[0]);
                const variant = cartItemOptionText(item);
                const busy = busyId === item._id;
                const issue = issues.get(item._id);
                return (
                  <div key={item._id} className={`${shopCard} flex gap-4 ${busy ? "opacity-60" : ""} ${issue ? "!border-red-300" : ""}`}>
                    <Link
                      href={product ? `/customer/product/${product._id}` : "#"}
                      className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#FAF6F0] sm:h-24 sm:w-24"
                    >
                      {img ? (
                        <ShopImage src={img} alt={product?.product_name_th ?? ""} width={192} height={192} sizes="96px" className="h-full w-full object-cover" />
                      ) : (
                        <FaImage className="text-2xl text-[#8C5A3C]/40" />
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-bold">{product ? localName(product.product_name_th, product.product_name_eng) : t("product")}</p>
                          {variant && <p className="text-xs text-gray-500">{variant}</p>}
                          <p className="text-sm text-gray-600">{t("perUnit", { price: baht(item.price_snapshot) })}</p>
                          {product && shipping.isProvinceOnly(product) && (
                            <p className="mt-1 flex items-start gap-1 text-xs font-medium text-sky-800">
                              <FaTruck className="mt-0.5 shrink-0" aria-hidden="true" />
                              {/* จอมือถือ: 2 บรรทัด · จอ ≥640: บรรทัดเดียว */}
                              <span>
                                <span className="block sm:inline">
                                  {shipping.province ? t("provinceOnly", { province: shipping.province }) : t("provinceOnlyGeneric")}
                                </span>{" "}
                                <span className="block font-normal text-sky-700 sm:inline">{t("provinceOnlyPickup")}</span>
                              </span>
                            </p>
                          )}
                          {issue && <p className="mt-1 text-xs font-semibold text-red-600">{cartIssueText(issue, t)}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate(item._id)}
                          disabled={busy}
                          aria-label={t("removeItem", { name: product ? localName(product.product_name_th, product.product_name_eng) : t("product") })}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3">
                        <div className="flex items-center overflow-hidden rounded-xl border border-[#8C5A3C]/30">
                          <button
                            type="button"
                            onClick={() => qtyMutation.mutate({ id: item._id, qty: item.quantity - 1 })}
                            disabled={busy || item.quantity <= 1}
                            aria-label={t("decrease")}
                            className="flex h-[34px] w-[36px] items-center justify-center font-bold text-[#8C5A3C] hover:bg-[#8C5A3C]/10 disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => qtyMutation.mutate({ id: item._id, qty: item.quantity + 1 })}
                            disabled={busy}
                            aria-label={t("increase")}
                            className="flex h-[34px] w-[36px] items-center justify-center font-bold text-[#8C5A3C] hover:bg-[#8C5A3C]/10 disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-bold text-[#8C5A3C]">{baht(item.line_total)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:sticky lg:top-44 lg:col-span-4">
              <div className={`${shopCard} space-y-4`}>
                <h2 className="border-b border-[#8C5A3C]/10 pb-3 text-lg font-bold">{t("summary")}</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{t("subtotal", { n: cart.summary.total_quantity })}</span>
                    <span className="font-semibold text-[#4A342E]">{baht(cart.summary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{t("deliveryFee")}</span>
                    <span className="italic text-[#8C5A3C]">{t("nextStep")}</span>
                  </div>
                </div>
                {issues.size > 0 ? (
                  <>
                    <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                      {t("blocked", { n: issues.size })}
                    </p>
                    <button type="button" disabled className={`${shopButtonPrimary} w-full`}>
                      {t("checkout")}
                    </button>
                  </>
                ) : (
                  <Link href="/customer/checkout" className={`${shopButtonPrimary} w-full`}>
                    {t("checkout")}
                  </Link>
                )}
                <p className="text-center text-xs text-gray-500">{t("payHint")}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** ส่วนพรีออเดอร์ที่ยังไม่ยืนยันในหน้าตะกร้า — ดูรายการ/ยอด แล้วไปยืนยันที่หน้ายืนยันพรีออเดอร์ (แก้จำนวนได้ที่นั่น) */
function PreorderCartSection({ basket }: { basket: PreorderBasket }) {
  const t = useTranslations("shop.cart");
  const { name: localName } = useLocalName();
  const locale = useLocale();
  const total = basket.items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  return (
    <section className={`${shopCard} flex flex-col gap-4 !border-[#8C5A3C]/30`} aria-labelledby="preorder-cart-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="preorder-cart-title" className="m-0 flex items-center gap-2 text-lg font-bold text-[#4A342E]">
            <CalendarCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
            {t("preorderTitle", { round: basket.round_name })}
          </h2>
          <p className="m-0 mt-1 text-xs text-gray-500">{t("preorderPickup", { date: thaiDate(basket.pickup_date, false, locale) })}</p>
        </div>
        <span className="rounded-full bg-[#8C5A3C]/10 px-2.5 py-1 text-xs font-semibold text-[#8C5A3C]">{t("preorderPending")}</span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {basket.items.map((it) => (
          <li key={`${it.round_item_id}|${it.option_text ?? ""}`} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="block">
                {localName(it.product_name_th, it.product_name_eng)} <span className="text-gray-500">×{it.quantity}</span>
              </span>
              {it.option_text && <span className="block text-xs text-gray-500">{it.option_text}</span>}
            </span>
            <span className="shrink-0 font-semibold">{baht(it.unit_price * it.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 border-t border-[#8C5A3C]/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="m-0 text-sm font-bold">{t("preorderTotal", { amount: baht(total) })}</p>
          <p className="m-0 text-xs text-gray-500">{t("preorderPayHint")}</p>
        </div>
        <Link href="/customer/preorder/checkout" className={`${shopButtonPrimary} sm:w-auto`}>
          {t("preorderConfirm")}
        </Link>
      </div>
    </section>
  );
}
