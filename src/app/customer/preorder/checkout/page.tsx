"use client";
// ─────────────────────────────────────────────────────────────
// /customer/preorder/checkout — ยืนยันพรีออเดอร์ (BACKLOG3-merge D3) · ยกจาก FrontOffice customer/preorder/checkout/page.tsx
// รายการจาก localStorage (preorderBasket) · 1 ใบ = 1 รอบ · POST /shop/preorders → /customer/account/preorders/{id}?new=1
// รับเอง: จุดรับ + วันรับ = วันรับของรอบ + อีก 12 วันตามวันที่จุดเปิด (backend preorderPickupDateOptions)
// จัดส่ง: สมุดที่อยู่ + ผู้รับ · ค่าส่ง POST /shop/orders/delivery-quote { product_ids } (สินค้าในรายการนี้ ไม่ใช่ตะกร้า)
// ส่วนลด: โค้ดส่วนลด หรือ คูปองของฉัน (อย่างใดอย่างหนึ่ง) + แต้ม — ฐานคิดแต้มเหมือนออเดอร์ปกติ (C3)
//   โค้ดผูกกับรายการ/จำนวน/วิธีรับ/ที่อยู่/ค่าส่ง ณ ตอนกดใช้ — เปลี่ยนอย่างใดอย่างหนึ่ง = ต้องกดใช้โค้ดใหม่ (ยอด/เงื่อนไขอาจเปลี่ยน)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { shopAddressesService } from "@/services/shopAddresses";
import { shopOrdersService } from "@/services/shopOrders";
import { shopPreordersService, type CreatePreorderInput } from "@/services/shopPreorders";
import { pickupLocationsService } from "@/services/pickupLocations";
import { couponDiscount, shopLoyaltyService } from "@/services/shopLoyalty";
import { resolveUploadUrl } from "@/lib/uploads";
import { alert } from "@/lib/alert";
import { normalizePromoCode } from "@/lib/promoCode";
import { isApiError } from "@/types/api";
import type { OrderType } from "@/types/order";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import PickupLocationPicker from "@/components/customer/PickupLocationPicker";
import CouponSelectBox from "@/components/customer/CouponSelectBox";
import CheckoutAddressForm from "@/components/customer/CheckoutAddressForm";
import { baht, shopButton, shopButtonPrimary, shopCard, shopInput, shopPage } from "@/components/customer/shopStyles";
import {
  pickupLocationsKey, preorderRoundKey, shopAddressesKey, shopCouponsKey, shopPointsKey, shopPreordersKey,
} from "../../lib/shopQueries";
import {
  basketLineKey, clearPreorderBasket, removePreorderBasketItem, updatePreorderBasketItem, usePreorderBasket,
} from "../lib/preorderBasket";
import { preorderPickupDates, thaiDate } from "../lib/preorderDates";
import { isRoundOpen, useNow } from "../lib/useNow";
import FlowSteps from "@/components/customer/FlowSteps";
import { useRecipientContact } from "../../hooks/useRecipientContact";
import ShopImage from "@/components/customer/ShopImage";

const PHONE_RE = /^0\d{8,9}$/;

export default function PreorderCheckoutPage() {
  const t = useTranslations("shop.preorderShop");
  return (
    <CustomerAuthGate message={t("loginToOrder")}>
      <PreorderCheckoutContent />
    </CustomerAuthGate>
  );
}

function PreorderCheckoutContent() {
  const t = useTranslations("shop.preorderShop");
  const tk = useTranslations("shop.checkout");
  const tp = useTranslations("shop.preorders");
  const { name: localName } = useLocalName();
  const tcart = useTranslations("shop.cart");
  const locale = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const basket = usePreorderBasket();

  const roundQ = useQuery({
    queryKey: preorderRoundKey(basket?.round_id ?? ""),
    queryFn: () => shopPreordersService.round(basket!.round_id),
    enabled: !!basket,
  });
  const addressesQ = useQuery({ queryKey: shopAddressesKey, queryFn: shopAddressesService.list });
  const pickupQ = useQuery({ queryKey: pickupLocationsKey, queryFn: pickupLocationsService.list });
  const couponsQ = useQuery({ queryKey: shopCouponsKey, queryFn: shopLoyaltyService.availableCoupons });

  const [orderType, setOrderType] = useState<OrderType>("takeaway");
  const [pickedAddressId, setPickedAddressId] = useState<string | null>(null);
  const { recipientName, setRecipientName, recipientPhone, setRecipientPhone } = useRecipientContact();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number; freeShipping: boolean; forKey: string } | null>(null);
  const [pickupLocationId, setPickupLocationId] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState<string | null>(null);

  const now = useNow();
  const isDelivery = orderType === "delivery";
  const addresses = addressesQ.data ?? [];
  const address = addresses.find((a) => a._id === pickedAddressId) ?? addresses[0] ?? null;
  const productIds = [...new Set((basket?.items ?? []).map((it) => it.product_id))];

  const quoteQ = useQuery({
    queryKey: ["shop", "delivery-quote", "preorder", address?.province, productIds],
    queryFn: () => shopOrdersService.deliveryQuote(address!.province, productIds),
    enabled: isDelivery && !!address && productIds.length > 0,
  });
  const deliveryFee = isDelivery ? (quoteQ.data?.fee ?? 0) : 0;
  const undeliverable = isDelivery && quoteQ.data?.deliverable === false;

  // โค้ดส่วนลดผูกกับ: รายการ + จำนวน (+ตัวเลือก) · วิธีรับ · ที่อยู่ · ค่าส่ง — เปลี่ยน = ต้องกดใช้โค้ดใหม่
  const promoKey = JSON.stringify([
    (basket?.items ?? []).map((it) => [basketLineKey(it), it.quantity]),
    orderType,
    isDelivery ? address?._id ?? null : null,
    deliveryFee,
  ]);
  const activePromo = promo && promo.forKey === promoKey ? promo : null;
  const promoMutation = useMutation({
    mutationFn: (code: string) =>
      shopOrdersService.validatePromotionForLines(
        code,
        (basket?.items ?? []).map((it) => ({ product_id: it.product_id, quantity: it.quantity, line_total: it.unit_price * it.quantity })),
        deliveryFee,
      ),
    onSuccess: (r) => {
      setPromo({ code: r.promotion_code, discount: r.discount_amount, freeShipping: r.free_shipping, forKey: promoKey });
      setCouponId(null); // โค้ดกับคูปองของฉันใช้พร้อมกันไม่ได้
      alert.success(tk("promoApplied"));
    },
    onError: (e) => {
      setPromo(null);
      alert.error(isApiError(e) ? e.message : tk("promoFailed"));
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: CreatePreorderInput) => shopPreordersService.create(body),
    onSuccess: (p) => {
      clearPreorderBasket();
      void qc.invalidateQueries({ queryKey: shopPreordersKey });
      void qc.invalidateQueries({ queryKey: shopPointsKey });
      void qc.invalidateQueries({ queryKey: shopCouponsKey });
      void qc.invalidateQueries({ queryKey: ["catalog", "preorder-rounds"] }); // โควตาเหลือเปลี่ยน
      router.replace(`/customer/account/preorders/${p._id}?new=1`);
    },
    onError: (e) => {
      alert.error(isApiError(e) ? e.message : t("orderFailed"));
      void qc.invalidateQueries({ queryKey: shopPointsKey });
      void qc.invalidateQueries({ queryKey: shopCouponsKey });
      void roundQ.refetch();
    },
  });

  if (!basket) {
    return (
      <div className={`${shopPage} flex items-center justify-center px-4`}>
        <div className={`${shopCard} w-full max-w-md space-y-4 text-center`}>
          <h2 className="text-lg font-bold">{t("emptyBasket")}</h2>
          <Link href="/customer/preorder" className={`${shopButtonPrimary} w-full`}>{tp("viewRounds")}</Link>
        </div>
      </div>
    );
  }

  const round = roundQ.data;
  const roundOpen = !!round && isRoundOpen(round, now);
  const activeItemIds = new Set((round?.items ?? []).map((it) => it._id));
  const missing = round ? basket.items.filter((it) => !activeItemIds.has(it.round_item_id)) : [];
  const subtotal = Math.round(basket.items.reduce((s, it) => s + it.unit_price * it.quantity, 0) * 100) / 100;

  // คูปอง/แต้ม — สูตรเดียวกับ checkout ปกติ (backend preorderService ใช้ฐานเดียวกับ orderService)
  const coupons = couponsQ.data ?? [];
  const selectedCoupon = coupons.find((c) => c._id === couponId) ?? null;
  // โค้ดส่วนลด (ถ้าใช้อยู่) แทนคูปอง — เลือกคูปองแล้ว setPromo(null) ที่ onSelect
  const couponAmount = activePromo
    ? activePromo.discount
    : selectedCoupon
      ? (couponDiscount(selectedCoupon, subtotal, deliveryFee).amount ?? 0)
      : 0;
  const total = Math.max(0, subtotal + deliveryFee - couponAmount);

  // จุดรับ: วันรับของพรีออเดอร์คิดจากวันรับของรอบ (ไม่ใช่ order_pickup_dates ของออเดอร์ปกติ)
  const pickupLocations = (pickupQ.data ?? [])
    .map((l) => ({ ...l, order_pickup_dates: preorderPickupDates(l, basket.pickup_date) }))
    .filter((l) => l.order_pickup_dates.length > 0);
  const needsPickup = !isDelivery && pickupLocations.length > 0;
  const pickupOk = !needsPickup || (!!pickupDate && !!pickupLocations.find((l) => l._id === pickupLocationId)?.order_pickup_dates.includes(pickupDate));
  const recipientOk = recipientName.trim().length > 0 && PHONE_RE.test(recipientPhone.trim());
  const qtyOk = basket.items.every((it) => it.quantity >= it.min_qty && it.quantity <= it.max_qty);
  const canSubmit =
    roundOpen && missing.length === 0 && qtyOk && !(promo && !activePromo) &&
    (isDelivery ? !!address && recipientOk && !quoteQ.isLoading && !undeliverable : !pickupQ.isLoading && pickupOk);

  const submit = () => {
    if (!canSubmit) return;
    const body: CreatePreorderInput = {
      round_id: basket.round_id,
      order_type: orderType,
      items: basket.items.map((it) => ({
        round_item_id: it.round_item_id,
        quantity: it.quantity,
        variant_ids: it.variant_ids,
        selected_options: it.options,
        special_request: it.special_request,
      })),
    };
    if (isDelivery && address) {
      body.address_id = address._id;
      body.recipient_name = recipientName.trim();
      body.recipient_phone = recipientPhone.trim();
    }
    if (needsPickup && pickupLocationId && pickupDate) {
      body.pickup_location_id = pickupLocationId;
      body.pickup_date = pickupDate;
    }
    if (activePromo) body.promotion_code = activePromo.code;
    else if (selectedCoupon && couponAmount > 0) body.user_coupon_id = selectedCoupon._id;
    createMutation.mutate(body);
  };

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px]">
        <CustomerBreadcrumb
          items={[{ label: tcart("title"), href: "/customer/cart" }, { label: basket.round_name, href: `/customer/preorder/${basket.round_id}` }, { label: t("confirm") }]}
          className="!mb-0"
        />
        <FlowSteps current={2} />
        <h1 className="m-0 text-xl font-bold sm:text-2xl">{t("confirm")}</h1>

        {round && !roundOpen && (
          <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{t("roundClosed", { round: basket.round_name })}</p>
        )}
        {missing.length > 0 && (
          <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {t("itemsGone", { names: missing.map((m) => localName(m.product_name_th, m.product_name_eng)).join(", ") })}
          </p>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-6">
            <section className={`${shopCard} space-y-3`}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="m-0 text-lg font-bold">{t("items")}</h2>
                <span className="text-xs text-gray-500">{t("pickupFrom", { date: thaiDate(basket.pickup_date, false, locale) })}</span>
              </div>
              {basket.items.map((it) => {
                const key = basketLineKey(it);
                const img = resolveUploadUrl(it.product_img);
                return (
                  <div key={key} className="flex gap-3 border-t border-[#8C5A3C]/10 pt-3 first:border-0 first:pt-0">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                      {img ? <ShopImage src={img} alt={""} width={128} height={128} sizes="64px" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="m-0 truncate text-sm font-bold">{localName(it.product_name_th, it.product_name_eng)}</p>
                        <button type="button" onClick={() => removePreorderBasketItem(key)} aria-label={t("removeItem", { name: localName(it.product_name_th, it.product_name_eng) })} className="text-gray-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {it.option_text && <p className="m-0 text-xs text-gray-500">{it.option_text}</p>}
                      <input
                        className="h-[44px] w-full rounded-lg border border-[#8C5A3C]/15 px-2 text-xs"
                        maxLength={500}
                        placeholder={t("notePlaceholder")}
                        aria-label={t("noteAria", { name: localName(it.product_name_th, it.product_name_eng) })}
                        value={it.special_request ?? ""}
                        onChange={(e) => updatePreorderBasketItem(key, { special_request: e.target.value || null })}
                      />
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center overflow-hidden rounded-lg border border-[#8C5A3C]/30">
                          <button type="button" aria-label={tcart("decrease")} disabled={it.quantity <= it.min_qty} onClick={() => updatePreorderBasketItem(key, { quantity: it.quantity - 1 })} className="h-[34px] w-[36px] font-bold text-[#8C5A3C] disabled:opacity-40">-</button>
                          <span className="w-9 text-center text-sm font-bold">{it.quantity}</span>
                          <button type="button" aria-label={tcart("increase")} disabled={it.quantity >= it.max_qty} onClick={() => updatePreorderBasketItem(key, { quantity: it.quantity + 1 })} className="h-[34px] w-[36px] font-bold text-[#8C5A3C] disabled:opacity-40">+</button>
                        </div>
                        <span className="text-sm font-semibold">{baht(it.unit_price * it.quantity)}</span>
                      </div>
                      {it.min_qty > 1 && <p className="m-0 text-[11px] text-gray-500">{t("minQty", { n: it.min_qty })}</p>}
                    </div>
                  </div>
                );
              })}
              <Link href={`/customer/preorder/${basket.round_id}`} className="inline-block text-sm font-semibold text-[#8C5A3C] hover:text-[#4A342E]">{t("addMore")}</Link>
            </section>


            <section className={`${shopCard} space-y-4`}>
              <h2 className="m-0 text-lg font-bold">{tk("receiveMethod")}</h2>
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={tk("receiveMethod")}>
                {([["takeaway", t("takeaway"), t("takeawayHint")], ["delivery", tk("delivery"), tk("deliveryHint")]] as const).map(([value, label, hint]) => (
                  <button key={value} type="button" role="radio" aria-checked={orderType === value} onClick={() => setOrderType(value)}
                    className={`rounded-xl border-2 p-4 text-left transition ${orderType === value ? "border-[#8C5A3C] bg-[#FAF6F0]" : "border-gray-200 hover:border-[#8C5A3C]/40"}`}>
                    <p className="m-0 font-bold">{label}</p>
                    <p className="m-0 text-xs text-gray-500">{hint}</p>
                  </button>
                ))}
              </div>

              {!isDelivery &&
                (pickupQ.isLoading ? (
                  <p className="text-sm text-gray-500">{tk("loadingPickup")}</p>
                ) : pickupLocations.length > 0 ? (
                  <PickupLocationPicker locations={pickupLocations} locationId={pickupLocationId} date={pickupDate} onChange={(id, d) => { setPickupLocationId(id); setPickupDate(d); }} />
                ) : (
                  <p className="rounded-xl bg-[#FAF6F0] p-3 text-sm text-gray-700">{t("pickupAtStore", { date: thaiDate(basket.pickup_date, false, locale) })}</p>
                ))}

              {isDelivery && (
                <div className="space-y-3">
                  {undeliverable && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{t("undeliverable", { reason: quoteQ.data?.message ?? tk("undeliverableDefault") })}</p>}
                  {addresses.length > 0 && (
                    <div className="space-y-2" role="radiogroup" aria-label={tk("deliveryAddress")}>
                      {addresses.map((a) => (
                        <button key={a._id} type="button" role="radio" aria-checked={address?._id === a._id} onClick={() => setPickedAddressId(a._id)}
                          className={`w-full rounded-xl border-2 p-3 text-left text-sm transition ${address?._id === a._id ? "border-[#8C5A3C] bg-[#FAF6F0]" : "border-gray-200 hover:border-[#8C5A3C]/40"}`}>
                          {a.house_no} {a.sub_district} {a.district} {a.province} {a.zip_code}
                        </button>
                      ))}
                    </div>
                  )}
                  {showAddressForm ? (
                    <CheckoutAddressForm
                      onCancel={() => setShowAddressForm(false)}
                      onCreated={(a) => { setShowAddressForm(false); setPickedAddressId(a._id); void qc.invalidateQueries({ queryKey: shopAddressesKey }); }}
                    />
                  ) : (
                    <button type="button" onClick={() => setShowAddressForm(true)} className="text-sm font-semibold text-[#8C5A3C] hover:text-[#4A342E]">{tk("addAddress")}</button>
                  )}
                  <div className="grid gap-3 border-t border-[#8C5A3C]/10 pt-4 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="font-semibold">{tk("recipientName")}</span>
                      <input className={shopInput} value={recipientName} maxLength={200} onChange={(e) => setRecipientName(e.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-semibold">{tk("recipientPhone")}</span>
                      <input className={shopInput} inputMode="tel" value={recipientPhone} maxLength={10} placeholder="0812345678" onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, ""))} />
                      {recipientPhone && !PHONE_RE.test(recipientPhone) && <span className="text-xs text-red-600">{tk("phoneInvalid")}</span>}
                    </label>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* สรุปพรีออเดอร์ครึ่งจอ (6/12) — ช่องโค้ด + คูปองแบบตั๋วไม่อึดอัด */}
          <div className="lg:sticky lg:top-44 lg:col-span-6">
            <div className={`${shopCard} space-y-4`}>
              <h2 className="m-0 border-b border-[#8C5A3C]/10 pb-3 text-lg font-bold">{t("summary")}</h2>

              <div className="flex gap-2">
                <input
                  className={shopInput}
                  value={promoInput}
                  placeholder={tk("promoCode")}
                  aria-label={tk("promoCode")}
                  onChange={(e) => setPromoInput(normalizePromoCode(e.target.value))}
                />
                <button
                  type="button"
                  className={`${shopButton} shrink-0`}
                  disabled={!promoInput || promoMutation.isPending || (isDelivery && quoteQ.isLoading)}
                  onClick={() => promoMutation.mutate(promoInput)}
                >
                  {promoMutation.isPending ? tk("checking") : tk("applyCode")}
                </button>
              </div>
              {/* เปลี่ยนรายการ/จำนวน/ที่อยู่/วิธีรับหลังใช้โค้ด — ต้องกดใช้ใหม่ (ปุ่มสั่งซื้อกดไม่ได้จนกว่าจะกดใช้ใหม่หรือเอาโค้ดออก) */}
              {promo && !activePromo && (
                <p className="m-0 flex flex-wrap items-center gap-2 text-xs text-amber-700">
                  {t("reapplyCode", { code: promo.code })}
                  <button type="button" onClick={() => setPromo(null)} className="font-semibold underline">{t("removeCode")}</button>
                </p>
              )}
              <CouponSelectBox
                coupons={coupons}
                selectedId={couponId}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                onSelect={(id) => {
                  setCouponId(id);
                  if (id) setPromo(null);
                }}
              />
              {/* ใช้แต้มตอนสั่งซื้อไม่ได้แล้ว (2026-10-26) — แลกแต้มเป็นคูปองที่หน้าสมาชิก แล้วเลือกคูปองด้านบน */}
              <Link href="/customer/account/member?tab=redeem" className="block rounded-xl bg-[#FAF6F0] px-3 py-2 text-xs font-semibold text-[#8C5A3C] hover:underline">
                {tcart("redeemPointsHint")}
              </Link>
              <div className="space-y-2 text-sm">
                <Line label={tk("subtotal")} value={baht(subtotal)} />
                <Line
                  label={tk("deliveryFee")}
                  value={!isDelivery ? baht(0) : !address ? tk("pickAddressFirst") : quoteQ.isLoading ? tk("calculating") : undeliverable ? tk("cannotDeliver") : baht(deliveryFee)}
                />
                {couponAmount > 0 && activePromo && <Line label={tk("discountCode", { code: activePromo.code })} value={`-${baht(couponAmount)}`} green />}
                {couponAmount > 0 && !activePromo && selectedCoupon && <Line label={tk("coupon", { code: selectedCoupon.promotion_code })} value={`-${baht(couponAmount)}`} green />}
              </div>
              <div className="flex items-baseline justify-between border-t border-[#8C5A3C]/10 pt-3">
                <span className="font-bold">{tk("amountDue")}</span>
                <span className="text-2xl font-extrabold text-[#8C5A3C]">{baht(total)}</span>
              </div>
              <p className="m-0 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{t("payWithin24")}</p>
              <button type="button" className={`${shopButtonPrimary} w-full`} disabled={!canSubmit || createMutation.isPending} onClick={submit}>
                {createMutation.isPending ? t("ordering") : t("confirm")}
              </button>
              {!qtyOk && <p className="m-0 text-center text-xs text-red-600">{t("qtyOutOfRange")}</p>}
              {isDelivery && !undeliverable && (!address || !recipientOk) && <p className="m-0 text-center text-xs text-gray-500">{t("needRecipient")}</p>}
              {needsPickup && !pickupOk && <p className="m-0 text-center text-xs text-gray-500">{t("needPickup")}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className={`flex justify-between ${green ? "text-green-700" : "text-gray-600"}`}>
      <span>{label}</span>
      <span className={`font-semibold ${green ? "" : "text-[#4A342E]"}`}>{value}</span>
    </div>
  );
}
