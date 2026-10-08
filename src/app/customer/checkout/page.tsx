"use client";
// ─────────────────────────────────────────────────────────────
// ยืนยันคำสั่งซื้อ — แทน FrontOffice customer/checkout/page.tsx (เขียนใหม่บน /shop/* ของ backend หลัก)
// 1) วิธีรับสินค้า: จัดส่ง (เลือก/เพิ่มที่อยู่ในสมุด + ชื่อ/เบอร์ผู้รับ) หรือรับที่จุดรับ (GET /catalog/pickup-locations + วันรับ)
// 2) ค่าส่ง: POST /shop/orders/delivery-quote ตามจังหวัด
// 3) ส่วนลด (C3): โค้ดส่วนลด (POST /shop/promotions/validate) **หรือ** คูปองของฉัน (GET /shop/coupons) อย่างใดอย่างหนึ่ง
//    + ใช้แต้มร่วมได้ (GET /shop/points) — เพดานแต้มคิดจากยอดสินค้าหลังหักคูปอง/โค้ด เหมือน backend orderService
// 4) สั่งซื้อ: POST /shop/orders (source "cart") → ไปหน้าออเดอร์ (/customer/account/purchases/[id]) เพื่อชำระเงิน/แนบสลิป
// ยอดที่แสดงเป็นยอดประมาณ — backend คิดค่าส่ง/ส่วนลด/แต้มใหม่เองตอนสร้างออเดอร์เสมอ
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartItemOptionText, shopCartService } from "@/services/shopCart";
import { shopAddressesService, type ShopAddress } from "@/services/shopAddresses";
import { shopOrdersService, type CreateShopOrderInput } from "@/services/shopOrders";
import { pickupLocationsService } from "@/services/pickupLocations";
import { couponDiscount, maxRedeemablePoints, pointsToBaht, shopLoyaltyService } from "@/services/shopLoyalty";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { OrderType } from "@/types/order";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import {
  baht, shopButton, shopButtonPrimary, shopCard, shopInput, shopPage,
} from "@/components/customer/shopStyles";
import { useCartCountStore } from "../store/cartCountStore";
import FlowSteps from "@/components/customer/FlowSteps";
import { pickupLocationsKey, shopAddressesKey, shopCartKey, shopCouponsKey, shopPointsKey } from "../lib/shopQueries";
import PickupLocationPicker from "@/components/customer/PickupLocationPicker";
import CheckoutAddressForm from "@/components/customer/CheckoutAddressForm";
import CouponSelectBox from "@/components/customer/CouponSelectBox";
import PointsRedeemBox from "@/components/customer/PointsRedeemBox";

const PHONE_RE = /^0\d{8,9}$/;

const formatAddress = (a: Pick<ShopAddress, "house_no" | "sub_district" | "district" | "province" | "zip_code">) =>
  `${a.house_no} ${a.sub_district} ${a.district} ${a.province} ${a.zip_code}`;

export default function CheckoutPage() {
  const t = useTranslations("shop.checkout");
  return (
    <CustomerAuthGate message={t("loginToOrder")}>
      <CheckoutContent />
    </CustomerAuthGate>
  );
}

function CheckoutContent() {
  const t = useTranslations("shop.checkout");
  const { name: localName } = useLocalName();
  const tc = useTranslations("shop.common");
  const tcart = useTranslations("shop.cart");
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useCustomerSession();
  const setCount = useCartCountStore((s) => s.setCount);

  const cartQ = useQuery({ queryKey: shopCartKey, queryFn: shopCartService.get });
  const addressesQ = useQuery({ queryKey: shopAddressesKey, queryFn: shopAddressesService.list });
  // จุดรับ/แต้ม/คูปอง โหลดไม่สำเร็จ = แค่ไม่แสดงส่วนนั้น (ไม่กันการสั่งซื้อ)
  const pickupQ = useQuery({ queryKey: pickupLocationsKey, queryFn: pickupLocationsService.list });
  const pointsQ = useQuery({ queryKey: shopPointsKey, queryFn: shopLoyaltyService.points });
  const couponsQ = useQuery({ queryKey: shopCouponsKey, queryFn: shopLoyaltyService.availableCoupons });

  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [pickedAddressId, setPickedAddressId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState(user?.fullname ?? "");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number; freeShipping: boolean; forKey: string } | null>(null);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState(0);
  const [pickupLocationId, setPickupLocationId] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState<string | null>(null);

  const addresses = addressesQ.data ?? [];
  // ยังไม่เลือกเอง = ใช้ที่อยู่ default (อยู่บนสุด)
  const address = addresses.find((a) => a._id === pickedAddressId) ?? addresses[0] ?? null;
  const isDelivery = orderType === "delivery";

  const quoteQ = useQuery({
    queryKey: ["shop", "delivery-quote", address?.province, cartQ.data?.summary.subtotal],
    queryFn: () => shopOrdersService.deliveryQuote(address!.province),
    enabled: isDelivery && !!address,
  });
  const deliveryFee = isDelivery ? (quoteQ.data?.fee ?? 0) : 0;
  // จังหวัดนี้ส่งไม่ได้ (มีสินค้าที่ส่งเฉพาะจังหวัดร้าน) — ต้องเปลี่ยนที่อยู่หรือรับเองที่ร้าน
  const undeliverable = isDelivery && quoteQ.data?.deliverable === false;

  // ส่วนลดผูกกับวิธีรับ + ค่าส่ง ณ ตอนตรวจโค้ด — เปลี่ยนอย่างใดอย่างหนึ่ง = ต้องกดใช้โค้ดใหม่
  const promoKey = `${orderType}|${deliveryFee}`;
  const activePromo = promo && promo.forKey === promoKey ? promo : null;

  const promoMutation = useMutation({
    mutationFn: (code: string) => shopOrdersService.validatePromotion(code, deliveryFee),
    onSuccess: (r) => {
      setPromo({ code: r.promotion_code, discount: r.discount_amount, freeShipping: r.free_shipping, forKey: promoKey });
      setCouponId(null); // โค้ดกับคูปองของฉันใช้พร้อมกันไม่ได้
      alert.success(t("promoApplied"));
    },
    onError: (e) => {
      setPromo(null);
      alert.error(isApiError(e) ? e.message : t("promoFailed"));
    },
  });

  const orderMutation = useMutation({
    mutationFn: (body: CreateShopOrderInput) => shopOrdersService.create(body),
    onSuccess: (order) => {
      setCount(0);
      qc.invalidateQueries({ queryKey: shopCartKey });
      qc.invalidateQueries({ queryKey: shopPointsKey });
      qc.invalidateQueries({ queryKey: shopCouponsKey });
      router.replace(`/customer/account/purchases/${order._id}?new=1`);
    },
    onError: (e) => {
      alert.error(isApiError(e) ? e.message : t("orderFailed"));
      // คูปองอาจถูกใช้/หมดอายุ หรือแต้มเปลี่ยนจากที่อื่น — โหลดใหม่ให้ยอดที่แสดงตรงกับ backend
      qc.invalidateQueries({ queryKey: shopPointsKey });
      qc.invalidateQueries({ queryKey: shopCouponsKey });
    },
  });

  if (cartQ.isLoading || addressesQ.isLoading) {
    return (
      <div className={`${shopPage} flex items-center justify-center`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8C5A3C]/20 border-t-[#8C5A3C]" aria-label={tc("loading")} />
      </div>
    );
  }

  const cart = cartQ.data;
  if (!cart || cart.items.length === 0) {
    return (
      <div className={`${shopPage} flex items-center justify-center px-4`}>
        <div className={`${shopCard} w-full max-w-md space-y-4 text-center`}>
          <h2 className="text-lg font-bold">{t("emptyCart")}</h2>
          <Link href="/customer/product" className={`${shopButtonPrimary} w-full`}>
            {tcart("browse")}
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = cart.summary.subtotal;

  // คูปองของฉัน — คิดใหม่ทุกครั้งที่ยอด/ค่าส่งเปลี่ยน · ใช้กับออเดอร์นี้ไม่ได้ = ไม่ส่งไป backend
  const coupons = couponsQ.data ?? [];
  const selectedCoupon = coupons.find((c) => c._id === couponId) ?? null;
  const couponAmount = selectedCoupon ? (couponDiscount(selectedCoupon, subtotal, deliveryFee).amount ?? 0) : 0;
  const codeOrCouponDiscount = activePromo ? activePromo.discount : couponAmount;
  const freeShippingDiscount = activePromo ? activePromo.freeShipping : selectedCoupon?.discount_type === "FreeShipping";

  // แต้ม: ฐาน = ยอดสินค้า − ส่วนลดสินค้าจากคูปอง/โค้ด (ไม่เกินยอดสินค้า) — ตรงกับ backend orderService.createOrder
  // ส่วนลดส่งฟรีไม่ลดฐาน (Q-BE14) · ค่าที่กรอกเกินเพดานใหม่ (เช่นเลือกคูปองทีหลัง) ถูกตัดลงอัตโนมัติ
  const goodsDiscount = freeShippingDiscount ? 0 : codeOrCouponDiscount;
  const points = pointsQ.data ?? null;
  let pointsToRedeem = 0;
  let maxPoints = 0;
  if (points) {
    maxPoints = maxRedeemablePoints(points.balance, subtotal - Math.min(goodsDiscount, subtotal), points.rules);
    const capped = Math.min(pointsInput, maxPoints);
    pointsToRedeem = capped - (capped % points.rules.REDEEM_STEP);
  }
  const pointsDiscount = points ? pointsToBaht(pointsToRedeem, points.rules) : 0;

  const discount = codeOrCouponDiscount + pointsDiscount;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  const recipientOk = recipientName.trim().length > 0 && PHONE_RE.test(recipientPhone.trim());

  // takeaway: มีจุดรับเปิดอยู่ = ต้องเลือกจุด + วัน (แบบ FrontOffice) · ไม่มีเลย = รับที่ร้านแบบเดิม (backend ไม่บังคับ)
  const pickupLocations = (pickupQ.data ?? []).filter((l) => l.order_pickup_dates.length > 0);
  const needsPickup = !isDelivery && pickupLocations.length > 0;
  const pickupOk =
    !needsPickup || (!!pickupDate && !!pickupLocations.find((l) => l._id === pickupLocationId)?.order_pickup_dates.includes(pickupDate));
  const canSubmit = isDelivery
    ? !!address && recipientOk && !quoteQ.isLoading && !undeliverable
    : !pickupQ.isLoading && pickupOk;

  const submit = () => {
    if (!canSubmit) return;
    const body: CreateShopOrderInput = { order_type: orderType };
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
    if (pointsToRedeem > 0) body.points_to_redeem = pointsToRedeem;
    orderMutation.mutate(body);
  };

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: tcart("title"), href: "/customer/cart" }, { label: t("confirmOrder") }]} className="!mb-0" />
        <FlowSteps kind="order" current={2} />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* วิธีรับสินค้า */}
            <section className={`${shopCard} space-y-4`}>
              <h2 className="text-lg font-bold">{t("receiveMethod")}</h2>
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("receiveMethod")}>
                {(
                  [
                    ["delivery", t("delivery"), t("deliveryHint")],
                    ["takeaway", t("takeaway"), t("takeawayHint")],
                  ] as const
                ).map(([value, label, hint]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={orderType === value}
                    onClick={() => setOrderType(value)}
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      orderType === value ? "border-[#8C5A3C] bg-[#FAF6F0]" : "border-gray-200 hover:border-[#8C5A3C]/40"
                    }`}
                  >
                    <p className="font-bold">{label}</p>
                    <p className="text-xs text-gray-500">{hint}</p>
                  </button>
                ))}
              </div>
            </section>

            {isDelivery && (
              <section className={`${shopCard} space-y-4`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{t("deliveryAddress")}</h2>
                  {!showAddressForm && (
                    <button type="button" onClick={() => setShowAddressForm(true)} className="text-sm font-semibold text-[#8C5A3C] hover:text-[#4A342E]">
                      {t("addAddress")}
                    </button>
                  )}
                </div>

                {addresses.length === 0 && !showAddressForm && (
                  <p className="text-sm text-gray-600">{t("noAddress")}</p>
                )}

                {undeliverable && (
                  <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {t("undeliverable", { reason: quoteQ.data?.message ?? t("undeliverableDefault") })}
                  </p>
                )}

                {addresses.length > 0 && (
                  <div className="space-y-2" role="radiogroup" aria-label={t("deliveryAddress")}>
                    {addresses.map((a) => {
                      const active = address?._id === a._id;
                      return (
                        <button
                          key={a._id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setPickedAddressId(a._id)}
                          className={`w-full rounded-xl border-2 p-3 text-left text-sm transition ${
                            active ? "border-[#8C5A3C] bg-[#FAF6F0]" : "border-gray-200 hover:border-[#8C5A3C]/40"
                          }`}
                        >
                          {formatAddress(a)}
                          {a.is_default && <span className="ml-2 rounded bg-[#8C5A3C]/10 px-1.5 py-0.5 text-xs font-semibold text-[#8C5A3C]">{t("default")}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {showAddressForm && (
                  <CheckoutAddressForm
                    onCancel={() => setShowAddressForm(false)}
                    onCreated={(a) => {
                      setShowAddressForm(false);
                      setPickedAddressId(a._id);
                      qc.invalidateQueries({ queryKey: shopAddressesKey });
                    }}
                  />
                )}

                <div className="grid gap-3 border-t border-[#8C5A3C]/10 pt-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold">{t("recipientName")}</span>
                    <input className={shopInput} value={recipientName} maxLength={200} onChange={(e) => setRecipientName(e.target.value)} />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold">{t("recipientPhone")}</span>
                    <input
                      className={shopInput}
                      inputMode="tel"
                      value={recipientPhone}
                      maxLength={10}
                      placeholder="0812345678"
                      onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, ""))}
                    />
                    {recipientPhone && !PHONE_RE.test(recipientPhone) && (
                      <span className="text-xs text-red-600">{t("phoneInvalid")}</span>
                    )}
                  </label>
                </div>
              </section>
            )}

            {!isDelivery && (pickupQ.isLoading || pickupLocations.length > 0) && (
              <section className={`${shopCard} space-y-4`}>
                <h2 className="text-lg font-bold">{t("pickupPoint")}</h2>
                {pickupQ.isLoading ? (
                  <p className="text-sm text-gray-500">{t("loadingPickup")}</p>
                ) : (
                  <PickupLocationPicker
                    locations={pickupLocations}
                    locationId={pickupLocationId}
                    date={pickupDate}
                    onChange={(id, d) => {
                      setPickupLocationId(id);
                      setPickupDate(d);
                    }}
                  />
                )}
              </section>
            )}

            {/* รายการสินค้า */}
            <section className={`${shopCard} space-y-3`}>
              <h2 className="text-lg font-bold">{t("items")}</h2>
              {cart.items.map((it) => {
                const name = typeof it.product_id === "object" && it.product_id ? localName(it.product_id.product_name_th, it.product_id.product_name_eng) : t("product");
                const options = cartItemOptionText(it);
                return (
                  <div key={it._id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate">
                        {name} <span className="text-gray-500">×{it.quantity}</span>
                      </span>
                      {options && <span className="block truncate text-xs text-gray-500">{options}</span>}
                    </span>
                    <span className="font-semibold">{baht(it.line_total)}</span>
                  </div>
                );
              })}
            </section>
          </div>

          {/* สรุปยอด */}
          <div className="lg:sticky lg:top-44 lg:col-span-4">
            <div className={`${shopCard} space-y-4`}>
              <h2 className="border-b border-[#8C5A3C]/10 pb-3 text-lg font-bold">{t("summary")}</h2>

              <div className="flex gap-2">
                <input
                  className={shopInput}
                  value={promoInput}
                  placeholder={t("promoCode")}
                  aria-label={t("promoCode")}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  className={`${shopButton} shrink-0`}
                  disabled={!promoInput.trim() || promoMutation.isPending || (isDelivery && quoteQ.isLoading)}
                  onClick={() => promoMutation.mutate(promoInput.trim())}
                >
                  {promoMutation.isPending ? t("checking") : t("applyCode")}
                </button>
              </div>
              {promo && !activePromo && <p className="text-xs text-amber-700">{t("reapplyCode")}</p>}

              <CouponSelectBox
                coupons={coupons}
                selectedId={couponId}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                onSelect={(id) => {
                  setCouponId(id);
                  if (id) setPromo(null); // คูปองของฉันกับโค้ดใช้พร้อมกันไม่ได้
                }}
              />

              {points && <PointsRedeemBox points={points} max={maxPoints} value={pointsInput} onChange={setPointsInput} />}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{t("subtotal")}</span>
                  <span className="font-semibold text-[#4A342E]">{baht(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t("deliveryFee")}</span>
                  <span className="font-semibold text-[#4A342E]">
                    {!isDelivery
                      ? baht(0)
                      : !address
                        ? t("pickAddressFirst")
                        : quoteQ.isLoading
                          ? t("calculating")
                          : quoteQ.isError
                            ? t("calcFailed")
                            : undeliverable
                              ? t("cannotDeliver")
                              : quoteQ.data?.free
                                ? t("free")
                                : baht(deliveryFee)}
                  </span>
                </div>
                {activePromo && (
                  <div className="flex justify-between text-green-700">
                    <span>{t("discountCode", { code: activePromo.code })}</span>
                    <span className="font-semibold">-{baht(activePromo.discount)}</span>
                  </div>
                )}
                {!activePromo && selectedCoupon && couponAmount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>{t("coupon", { code: selectedCoupon.promotion_code })}</span>
                    <span className="font-semibold">-{baht(couponAmount)}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>{t("points", { n: pointsToRedeem.toLocaleString() })}</span>
                    <span className="font-semibold">-{baht(pointsDiscount)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-baseline justify-between border-t border-[#8C5A3C]/10 pt-3">
                <span className="font-bold">{t("amountDue")}</span>
                <span className="text-2xl font-extrabold text-[#8C5A3C]">{baht(total)}</span>
              </div>

              <button type="button" className={`${shopButtonPrimary} w-full`} disabled={!canSubmit || orderMutation.isPending} onClick={submit}>
                {orderMutation.isPending ? t("ordering") : t("confirmOrder")}
              </button>
              {isDelivery && !undeliverable && (!address || !recipientOk) && (
                <p className="text-center text-xs text-gray-500">{t("needRecipient")}</p>
              )}
              {needsPickup && !pickupOk && (
                <p className="text-center text-xs text-gray-500">{t("needPickup")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

