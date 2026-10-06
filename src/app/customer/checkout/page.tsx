"use client";
// ─────────────────────────────────────────────────────────────
// ยืนยันคำสั่งซื้อ — แทน FrontOffice customer/checkout/page.tsx (เขียนใหม่บน /shop/* ของ backend หลัก)
// 1) วิธีรับสินค้า: จัดส่ง (เลือก/เพิ่มที่อยู่ในสมุด + ชื่อ/เบอร์ผู้รับ) หรือรับที่ร้าน
// 2) ค่าส่ง: POST /shop/orders/delivery-quote ตามจังหวัด · 3) โค้ดส่วนลด: POST /shop/promotions/validate
// 4) สั่งซื้อ: POST /shop/orders (source "cart") → ไปหน้าออเดอร์ (/customer/account/purchases/[id]) เพื่อชำระเงิน/แนบสลิป
// ยอดที่แสดงเป็นยอดประมาณ — backend คิดค่าส่ง/ส่วนลดใหม่เองตอนสร้างออเดอร์เสมอ
// ตัดออก (backend ยังไม่รองรับ): จุดรับสินค้าหลายสาขา · คูปองในกระเป๋า · แต้มสะสม · วันเวลานัดรับ
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shopCartService } from "@/services/shopCart";
import { shopAddressesService, type ShopAddress, type ShopAddressInput } from "@/services/shopAddresses";
import { shopOrdersService, type CreateShopOrderInput } from "@/services/shopOrders";
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
import { shopAddressesKey, shopCartKey } from "../lib/shopQueries";

const PHONE_RE = /^0\d{8,9}$/;
const ZIP_RE = /^\d{5}$/;

const formatAddress = (a: Pick<ShopAddress, "house_no" | "sub_district" | "district" | "province" | "zip_code">) =>
  `${a.house_no} ${a.sub_district} ${a.district} ${a.province} ${a.zip_code}`;

export default function CheckoutPage() {
  return (
    <CustomerAuthGate message="กรุณาเข้าสู่ระบบเพื่อสั่งซื้อสินค้า">
      <CheckoutContent />
    </CustomerAuthGate>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useCustomerSession();
  const setCount = useCartCountStore((s) => s.setCount);

  const cartQ = useQuery({ queryKey: shopCartKey, queryFn: shopCartService.get });
  const addressesQ = useQuery({ queryKey: shopAddressesKey, queryFn: shopAddressesService.list });

  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [pickedAddressId, setPickedAddressId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState(user?.fullname ?? "");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number; forKey: string } | null>(null);

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
      setPromo({ code: r.promotion_code, discount: r.discount_amount, forKey: promoKey });
      alert.success("ใช้โค้ดส่วนลดแล้ว");
    },
    onError: (e) => {
      setPromo(null);
      alert.error(isApiError(e) ? e.message : "ใช้โค้ดส่วนลดไม่สำเร็จ");
    },
  });

  const orderMutation = useMutation({
    mutationFn: (body: CreateShopOrderInput) => shopOrdersService.create(body),
    onSuccess: (order) => {
      setCount(0);
      qc.invalidateQueries({ queryKey: shopCartKey });
      router.replace(`/customer/account/purchases/${order._id}?new=1`);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : "สั่งซื้อไม่สำเร็จ กรุณาลองใหม่"),
  });

  if (cartQ.isLoading || addressesQ.isLoading) {
    return (
      <div className={`${shopPage} flex items-center justify-center`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8C5A3C]/20 border-t-[#8C5A3C]" aria-label="กำลังโหลด" />
      </div>
    );
  }

  const cart = cartQ.data;
  if (!cart || cart.items.length === 0) {
    return (
      <div className={`${shopPage} flex items-center justify-center px-4`}>
        <div className={`${shopCard} w-full max-w-md space-y-4 text-center`}>
          <h2 className="text-lg font-bold">ไม่มีสินค้าในตะกร้า</h2>
          <Link href="/customer/product" className={`${shopButtonPrimary} w-full`}>
            เลือกชมสินค้า
          </Link>
        </div>
      </div>
    );
  }

  const discount = activePromo?.discount ?? 0;
  const total = Math.max(0, cart.summary.subtotal + deliveryFee - discount);
  const recipientOk = recipientName.trim().length > 0 && PHONE_RE.test(recipientPhone.trim());
  const canSubmit = !isDelivery || (!!address && recipientOk && !quoteQ.isLoading && !undeliverable);

  const submit = () => {
    if (!canSubmit) return;
    const body: CreateShopOrderInput = { order_type: orderType };
    if (isDelivery && address) {
      body.address_id = address._id;
      body.recipient_name = recipientName.trim();
      body.recipient_phone = recipientPhone.trim();
    }
    if (activePromo) body.promotion_code = activePromo.code;
    orderMutation.mutate(body);
  };

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <CustomerBreadcrumb items={[{ label: "ตะกร้าสินค้า", href: "/customer/cart" }, { label: "ยืนยันคำสั่งซื้อ" }]} className="!mb-0" />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* วิธีรับสินค้า */}
            <section className={`${shopCard} space-y-4`}>
              <h2 className="text-lg font-bold">วิธีรับสินค้า</h2>
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="วิธีรับสินค้า">
                {(
                  [
                    ["delivery", "จัดส่งถึงบ้าน", "คิดค่าจัดส่งตามพื้นที่"],
                    ["takeaway", "รับเองที่ร้าน", "ไม่มีค่าจัดส่ง"],
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
                  <h2 className="text-lg font-bold">ที่อยู่จัดส่ง</h2>
                  {!showAddressForm && (
                    <button type="button" onClick={() => setShowAddressForm(true)} className="text-sm font-semibold text-[#8C5A3C] hover:text-[#4A342E]">
                      + เพิ่มที่อยู่ใหม่
                    </button>
                  )}
                </div>

                {addresses.length === 0 && !showAddressForm && (
                  <p className="text-sm text-gray-600">ยังไม่มีที่อยู่ที่บันทึกไว้ — กด &quot;เพิ่มที่อยู่ใหม่&quot;</p>
                )}

                {undeliverable && (
                  <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {quoteQ.data?.message ?? "จัดส่งไปที่อยู่นี้ไม่ได้"} — เลือกที่อยู่อื่น หรือเปลี่ยนเป็นรับเองที่ร้าน
                  </p>
                )}

                {addresses.length > 0 && (
                  <div className="space-y-2" role="radiogroup" aria-label="ที่อยู่จัดส่ง">
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
                          {a.is_default && <span className="ml-2 rounded bg-[#8C5A3C]/10 px-1.5 py-0.5 text-xs font-semibold text-[#8C5A3C]">ค่าเริ่มต้น</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {showAddressForm && (
                  <AddressForm
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
                    <span className="font-semibold">ชื่อผู้รับ</span>
                    <input className={shopInput} value={recipientName} maxLength={200} onChange={(e) => setRecipientName(e.target.value)} />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-semibold">เบอร์โทรผู้รับ</span>
                    <input
                      className={shopInput}
                      inputMode="tel"
                      value={recipientPhone}
                      maxLength={10}
                      placeholder="0812345678"
                      onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, ""))}
                    />
                    {recipientPhone && !PHONE_RE.test(recipientPhone) && (
                      <span className="text-xs text-red-600">เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9–10 หลัก</span>
                    )}
                  </label>
                </div>
              </section>
            )}

            {/* รายการสินค้า */}
            <section className={`${shopCard} space-y-3`}>
              <h2 className="text-lg font-bold">รายการสินค้า</h2>
              {cart.items.map((it) => {
                const name = typeof it.product_id === "object" && it.product_id ? it.product_id.product_name_th : "สินค้า";
                return (
                  <div key={it._id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      {name} <span className="text-gray-500">×{it.quantity}</span>
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
              <h2 className="border-b border-[#8C5A3C]/10 pb-3 text-lg font-bold">สรุปคำสั่งซื้อ</h2>

              <div className="flex gap-2">
                <input
                  className={shopInput}
                  value={promoInput}
                  placeholder="โค้ดส่วนลด"
                  aria-label="โค้ดส่วนลด"
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  className={`${shopButton} shrink-0`}
                  disabled={!promoInput.trim() || promoMutation.isPending || (isDelivery && quoteQ.isLoading)}
                  onClick={() => promoMutation.mutate(promoInput.trim())}
                >
                  {promoMutation.isPending ? "กำลังตรวจ..." : "ใช้โค้ด"}
                </button>
              </div>
              {promo && !activePromo && <p className="text-xs text-amber-700">ค่าจัดส่งหรือวิธีรับสินค้าเปลี่ยน — กรุณากดใช้โค้ดอีกครั้ง</p>}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>ยอดรวมสินค้า</span>
                  <span className="font-semibold text-[#4A342E]">{baht(cart.summary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ค่าจัดส่ง</span>
                  <span className="font-semibold text-[#4A342E]">
                    {!isDelivery
                      ? baht(0)
                      : !address
                        ? "เลือกที่อยู่ก่อน"
                        : quoteQ.isLoading
                          ? "กำลังคำนวณ..."
                          : quoteQ.isError
                            ? "คำนวณไม่สำเร็จ"
                            : undeliverable
                              ? "จัดส่งไม่ได้"
                              : quoteQ.data?.free
                                ? "ส่งฟรี"
                                : baht(deliveryFee)}
                  </span>
                </div>
                {activePromo && (
                  <div className="flex justify-between text-green-700">
                    <span>ส่วนลด ({activePromo.code})</span>
                    <span className="font-semibold">-{baht(discount)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-baseline justify-between border-t border-[#8C5A3C]/10 pt-3">
                <span className="font-bold">ยอดชำระ</span>
                <span className="text-2xl font-extrabold text-[#8C5A3C]">{baht(total)}</span>
              </div>

              <button type="button" className={`${shopButtonPrimary} w-full`} disabled={!canSubmit || orderMutation.isPending} onClick={submit}>
                {orderMutation.isPending ? "กำลังสั่งซื้อ..." : "ยืนยันคำสั่งซื้อ"}
              </button>
              {isDelivery && !undeliverable && (!address || !recipientOk) && (
                <p className="text-center text-xs text-gray-500">กรอกที่อยู่ ชื่อ และเบอร์โทรผู้รับให้ครบก่อนสั่งซื้อ</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const EMPTY_ADDRESS: ShopAddressInput = { house_no: "", sub_district: "", district: "", province: "", zip_code: "" };

function AddressForm({ onCreated, onCancel }: { onCreated: (a: ShopAddress) => void; onCancel: () => void }) {
  const [form, setForm] = useState<ShopAddressInput>(EMPTY_ADDRESS);
  const [isDefault, setIsDefault] = useState(false);

  const createMutation = useMutation({
    mutationFn: () =>
      shopAddressesService.create({
        house_no: form.house_no.trim(),
        sub_district: form.sub_district.trim(),
        district: form.district.trim(),
        province: form.province.trim(),
        zip_code: form.zip_code.trim(),
        is_default: isDefault,
      }),
    onSuccess: (a) => {
      alert.success("บันทึกที่อยู่แล้ว");
      onCreated(a);
    },
    onError: (e) => alert.error(isApiError(e) ? e.message : "บันทึกที่อยู่ไม่สำเร็จ"),
  });

  const fields: { key: keyof ShopAddressInput; label: string; max: number; wide?: boolean }[] = [
    { key: "house_no", label: "บ้านเลขที่ / หมู่ / ถนน", max: 200, wide: true },
    { key: "sub_district", label: "ตำบล / แขวง", max: 120 },
    { key: "district", label: "อำเภอ / เขต", max: 120 },
    { key: "province", label: "จังหวัด", max: 120 },
    { key: "zip_code", label: "รหัสไปรษณีย์", max: 5 },
  ];
  const filled = fields.every((f) => String(form[f.key] ?? "").trim()) && ZIP_RE.test(form.zip_code.trim());

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-[#8C5A3C]/30 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className={`space-y-1 text-sm ${f.wide ? "sm:col-span-2" : ""}`}>
            <span className="font-semibold">{f.label}</span>
            <input
              className={shopInput}
              value={String(form[f.key] ?? "")}
              maxLength={f.max}
              inputMode={f.key === "zip_code" ? "numeric" : undefined}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [f.key]: f.key === "zip_code" ? e.target.value.replace(/\D/g, "") : e.target.value,
                }))
              }
            />
          </label>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        ตั้งเป็นที่อยู่เริ่มต้น
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" className={shopButton} onClick={onCancel} disabled={createMutation.isPending}>
          ยกเลิก
        </button>
        <button type="button" className={shopButtonPrimary} disabled={!filled || createMutation.isPending} onClick={() => createMutation.mutate()}>
          {createMutation.isPending ? "กำลังบันทึก..." : "บันทึกที่อยู่"}
        </button>
      </div>
    </div>
  );
}
