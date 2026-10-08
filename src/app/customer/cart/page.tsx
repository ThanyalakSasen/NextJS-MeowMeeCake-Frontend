"use client";
// ─────────────────────────────────────────────────────────────
// ตะกร้าสินค้า — แทน FrontOffice customer/cart/page.tsx (เขียนใหม่บน /shop/cart ของ backend หลัก)
// แก้จำนวน = PATCH /shop/cart/items/{id} (backend ตรวจสต็อกแล้วตอบข้อความเอง) · ลบ = DELETE
// ตัดออก (backend ยังไม่รองรับ): แพ็กเกจ/เซ็ตขนม · ตัวเลือกสินค้าหลายตัว · หมายเหตุต่อชิ้น
// รายการที่ซื้อไม่ได้ (ปิดขาย · หมด · สต็อกไม่พอ — สต็อกจาก /catalog/products/:id) แสดงต่อบรรทัด + ปิดปุ่มสั่งซื้อ (U6 · lib/cartIssues)
// backend ตรวจซ้ำตอนกดสั่งซื้อเสมอ · ช่องค้นหาอยู่ใน Navbar หน้าร้านแล้ว (FrontOffice ซ่อน Navbar ในตะกร้าเลยมีช่องแยก)
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
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
    onSuccess: () => {
      alert.success(t("removed"));
      refresh();
    },
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

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: t("title") }]} className="!mb-0" />

        {cart.items.length === 0 ? (
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
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={product?.product_name_th ?? ""} className="h-full w-full object-cover" />
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
                          {issue && <p className="mt-1 text-xs font-semibold text-red-600">{cartIssueText(issue, t)}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate(item._id)}
                          disabled={busy}
                          aria-label={t("removeItem", { name: product ? localName(product.product_name_th, product.product_name_eng) : t("product") })}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
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
                            className="flex h-9 w-9 items-center justify-center font-bold text-[#8C5A3C] hover:bg-[#8C5A3C]/10 disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => qtyMutation.mutate({ id: item._id, qty: item.quantity + 1 })}
                            disabled={busy}
                            aria-label={t("increase")}
                            className="flex h-9 w-9 items-center justify-center font-bold text-[#8C5A3C] hover:bg-[#8C5A3C]/10 disabled:opacity-40"
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
