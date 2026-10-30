"use client";
// ─────────────────────────────────────────────────────────────
// ยืนยันคำสั่งซื้อ (ตะกร้ารวม 2026-10-27) — สินค้าปกติในตะกร้า + พรีออเดอร์ทุกรอบ สั่งในหน้าเดียวครั้งเดียว
// 1 บิลต่อการส่ง/รับ 1 รอบ: สินค้าปกติ = 1 บิล · พรีออเดอร์ = 1 บิลต่อรอบ (backend 1 พรีออเดอร์ = 1 รอบ)
// แต่ละบิลเลือกวิธีรับเอง (จัดส่ง: ที่อยู่ · รับเอง: จุดรับ + วันรับ) — ตั้งค่าเริ่มต้นให้แล้ว (ที่อยู่ default · จุดรับ/วันแรก)
//   ลูกค้าส่วนใหญ่แค่ตรวจแล้วกดสั่งซื้อ · ผู้รับ (ชื่อ/เบอร์) กรอกครั้งเดียวใช้ทุกบิลที่จัดส่ง
// ค่าส่งคิดต่อบิล (POST /shop/orders/delivery-quote · พรีออเดอร์ส่งได้ทุกจังหวัด)
// คูปอง/โค้ดส่วนลดใช้ได้บิลเดียว — เลือกบิลที่ลดได้มากที่สุดให้อัตโนมัติ
// สั่งซื้อ: POST /shop/checkout → หลายบิล = ไปหน้าชำระรวม (QR ยอดรวม + สลิปเดียว) · บิลเดียว = หน้าบิลนั้นตามเดิม
// สั่งเฉพาะรายการที่ติ๊กเลือกในตะกร้า (lib/cartSelection) — ที่ไม่ได้เลือกยังอยู่ในตะกร้าหลังสั่ง
// ยอดที่แสดงเป็นยอดประมาณ — backend คิดค่าส่ง/ส่วนลดใหม่เองตอนสร้างบิลเสมอ
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaCalendarCheck, FaCheckCircle, FaImage, FaMapMarkerAlt, FaPen, FaShoppingCart, FaStore, FaTruck } from "react-icons/fa";
import { resolveUploadUrl } from "@/lib/uploads";
import ShopImage from "@/components/customer/ShopImage";
import { cartItemOptionText, shopCartService } from "@/services/shopCart";
import { shopAddressesService, type ShopAddress } from "@/services/shopAddresses";
import { shopOrdersService, type CreateShopOrderInput, type DeliveryQuote } from "@/services/shopOrders";
import { shopPreordersService, type CreatePreorderInput, type StorefrontRoundDetail } from "@/services/shopPreorders";
import { billHref, paymentGroupHref, shopCheckoutService } from "@/services/shopCheckout";
import { pickupLocationsService, type PickupLocation } from "@/services/pickupLocations";
import { couponDiscount, shopLoyaltyService } from "@/services/shopLoyalty";
import { normalizePromoCode } from "@/lib/promoCode";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import type { OrderType } from "@/types/order";
import CustomerAuthGate from "@/components/customer/CustomerAuthGate";
import CustomerBreadcrumb from "@/components/customer/CustomerBreadcrumb";
import { baht, shopButton, shopButtonPrimary, shopCard, shopInput, shopPage } from "@/components/customer/shopStyles";
import { useCartCountStore } from "../store/cartCountStore";
import FlowSteps from "@/components/customer/FlowSteps";
import { useRecipientContact } from "../hooks/useRecipientContact";
import {
  pickupLocationsKey, preorderRoundKey, shopAddressesKey, shopCartKey, shopCouponsKey, shopOrdersKey, shopPointsKey, shopPreordersKey,
} from "../lib/shopQueries";
import { basketLineKey, removePreorderLines, selectedBaskets, usePreorderBaskets, type PreorderBasket } from "../preorder/lib/preorderBasket";
import { useCartSelection } from "../lib/cartSelection";
import { preorderPickupDates, thaiDate } from "../preorder/lib/preorderDates";
import { isRoundOpen, useNow } from "../preorder/lib/useNow";
import PickupLocationPicker from "@/components/customer/PickupLocationPicker";
import CheckoutAddressForm, { type AddressFields } from "@/components/customer/CheckoutAddressForm";
import CouponSelectBox from "@/components/customer/CouponSelectBox";
import ShopSpinner from "@/components/customer/ShopSpinner";

const PHONE_RE = /^0\d{8,9}$/;
const ORDER_KEY = "order";
const round2 = (n: number) => Math.round(n * 100) / 100;

/** วันรับห่างกันได้ไม่เกินกี่วันถึงรวมค่าส่ง — ตรงกับ backend checkoutService.COMBINE_SHIPPING_DAYS */
const COMBINE_SHIPPING_DAYS = 7;
/** "YYYY-MM-DD" ตามเวลาไทย (backend bangkokDateString) */
const bangkokYmd = (d: Date) => new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
const dayNo = (ymd: string) => Math.floor(Date.parse(`${ymd}T00:00:00Z`) / 86_400_000);
const shipAddressKey = (a: Pick<ShopAddress, "house_no" | "sub_district" | "district" | "province" | "zip_code">) =>
  [a.house_no, a.sub_district, a.district, a.province, a.zip_code].map((v) => String(v ?? "").trim().replace(/\s+/g, " ").toLowerCase()).join("|");

/**
 * บิลที่ไม่เก็บค่าส่ง → key ของบิลที่เก็บค่าส่งแทน — สำเนากติกา backend combinedShippingWaivers:
 * ต่อที่อยู่ เรียงตามวันรับ (เสมอกัน = ตามลำดับบิล) บิลแรกเก็บ · ห่างจากบิลที่เก็บ ≤ 7 วัน = ไม่เก็บ · เกิน = เริ่มกลุ่มใหม่
 */
function combinedShipping(bills: { key: string; address: ShopAddress; date: string }[]): Map<string, string> {
  const out = new Map<string, string>();
  const groups = new Map<string, { key: string; date: string; i: number }[]>();
  bills.forEach((b, i) => {
    const k = shipAddressKey(b.address);
    groups.set(k, [...(groups.get(k) ?? []), { key: b.key, date: b.date, i }]);
  });
  for (const g of groups.values()) {
    let payer: { key: string; day: number } | null = null;
    for (const b of [...g].sort((x, y) => dayNo(x.date) - dayNo(y.date) || x.i - y.i)) {
      const d = dayNo(b.date);
      if (payer && d - payer.day <= COMBINE_SHIPPING_DAYS) out.set(b.key, payer.key);
      else payer = { key: b.key, day: d };
    }
  }
  return out;
}

const formatAddress = (a: Pick<ShopAddress, "house_no" | "sub_district" | "district" | "province" | "zip_code">) =>
  `${a.house_no} ${a.sub_district} ${a.district} ${a.province} ${a.zip_code}`;

interface BillLine {
  key: string;
  name: string;
  options: string | null;
  img: string | null;
  unitPrice: number;
  quantity: number;
  total: number;
}

/** 1 บิลในหน้านี้ (ยังไม่สั่ง) — key = "order" หรือ round_id */
interface BillDraft {
  key: string;
  kind: "order" | "preorder";
  lines: BillLine[];
  subtotal: number;
  productIds: string[];
  /** บิลสินค้าปกติ: รายการในตะกร้าที่เลือกสั่ง · ทั้งตะกร้าถูกเลือก = allCart */
  cartItemIds: string[];
  allCart: boolean;
  /** จุดรับที่เลือกได้ + วันรับของบิลนี้ (พรีออเดอร์คิดจากวันรับของรอบ) */
  pickupLocations: PickupLocation[];
  defaultType: OrderType;
  basket: PreorderBasket | null;
  round: StorefrontRoundDetail | null;
  roundLoading: boolean;
  /** โหลดรอบไม่สำเร็จ — สั่งบิลนี้ไม่ได้ (ตรวจรอบเปิด/สินค้าในรอบไม่ได้) ต้องบอกลูกค้า ไม่ใช่ปุ่มกดไม่ได้เฉย ๆ */
  roundError: boolean;
}

interface BillConfig {
  orderType?: OrderType;
  addressId?: string;
  /** ที่อยู่ที่แก้เฉพาะคำสั่งซื้อนี้ (ไม่บันทึกลงสมุด) — ใช้เมื่อยังเลือกที่อยู่ baseId อยู่ · null = ใช้ที่อยู่เดิม */
  addressEdit?: { baseId: string; fields: AddressFields } | null;
  pickupLocationId?: string | null;
  pickupDate?: string | null;
}

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
  const tp = useTranslations("shop.preorderShop");
  const tc = useTranslations("shop.common");
  const tcart = useTranslations("shop.cart");
  const { name: localName } = useLocalName();
  const router = useRouter();
  const qc = useQueryClient();
  const setCount = useCartCountStore((s) => s.setCount);
  const now = useNow();

  const cartQ = useQuery({ queryKey: shopCartKey, queryFn: shopCartService.get });
  const allBaskets = usePreorderBaskets();
  const sel = useCartSelection();
  const baskets = selectedBaskets(allBaskets, sel.isSelected);
  const roundQs = useQueries({
    queries: baskets.map((b) => ({ queryKey: preorderRoundKey(b.round_id), queryFn: () => shopPreordersService.round(b.round_id) })),
  });
  const addressesQ = useQuery({ queryKey: shopAddressesKey, queryFn: shopAddressesService.list });
  // จุดรับ/คูปอง โหลดไม่สำเร็จ = แค่ไม่แสดงส่วนนั้น (ไม่กันการสั่งซื้อ)
  const pickupQ = useQuery({ queryKey: pickupLocationsKey, queryFn: pickupLocationsService.list });
  const couponsQ = useQuery({ queryKey: shopCouponsKey, queryFn: shopLoyaltyService.availableCoupons });

  const { recipientName, setRecipientName, recipientPhone, setRecipientPhone } = useRecipientContact();
  const [configs, setConfigs] = useState<Record<string, BillConfig>>({});
  const [addressFormFor, setAddressFormFor] = useState<string | null>(null);
  const [addressEditFor, setAddressEditFor] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; billKey: string; discount: number; forKey: string } | null>(null);
  const [couponId, setCouponId] = useState<string | null>(null);

  const addresses = addressesQ.data ?? [];
  const pickupAll = pickupQ.data ?? [];
  const cart = cartQ.data;

  // ── บิลทั้งหมด ──
  const bills: BillDraft[] = [];
  const pickedCart = (cart?.items ?? []).filter((it) => sel.isSelected(it._id));
  if (cart && pickedCart.length > 0) {
    bills.push({
      key: ORDER_KEY,
      kind: "order",
      lines: pickedCart.map((it) => ({
        key: it._id,
        name: typeof it.product_id === "object" && it.product_id ? localName(it.product_id.product_name_th, it.product_id.product_name_eng) : t("product"),
        options: cartItemOptionText(it) || null,
        img: resolveUploadUrl(typeof it.product_id === "object" && it.product_id ? it.product_id.product_img?.[0] : null) ?? null,
        unitPrice: it.price_snapshot,
        quantity: it.quantity,
        total: it.line_total,
      })),
      subtotal: round2(pickedCart.reduce((s, it) => s + it.line_total, 0)),
      productIds: [
        ...new Set(pickedCart.map((it) => (typeof it.product_id === "object" && it.product_id ? it.product_id._id : String(it.product_id)))),
      ],
      cartItemIds: pickedCart.map((it) => it._id),
      allCart: pickedCart.length === cart.items.length,
      pickupLocations: pickupAll.filter((l) => l.order_pickup_dates.length > 0),
      defaultType: "delivery",
      basket: null,
      round: null,
      roundLoading: false,
      roundError: false,
    });
  }
  baskets.forEach((b, i) => {
    bills.push({
      key: b.round_id,
      kind: "preorder",
      lines: b.items.map((it) => ({
        key: basketLineKey(it),
        name: localName(it.product_name_th, it.product_name_eng),
        options: it.option_text,
        img: resolveUploadUrl(it.product_img) ?? null,
        unitPrice: it.unit_price,
        quantity: it.quantity,
        total: round2(it.unit_price * it.quantity),
      })),
      subtotal: round2(b.items.reduce((s, it) => s + it.unit_price * it.quantity, 0)),
      productIds: [...new Set(b.items.map((it) => it.product_id))],
      cartItemIds: [],
      allCart: false,
      // วันรับของพรีออเดอร์คิดจากวันรับของรอบ (ไม่ใช่ order_pickup_dates ของออเดอร์ปกติ)
      pickupLocations: pickupAll
        .map((l) => ({ ...l, order_pickup_dates: preorderPickupDates(l, b.pickup_date) }))
        .filter((l) => l.order_pickup_dates.length > 0),
      defaultType: "takeaway",
      basket: b,
      round: roundQs[i]?.data ?? null,
      roundLoading: !!roundQs[i]?.isLoading,
      roundError: !!roundQs[i]?.isError && !roundQs[i]?.data,
    });
  });

  // ค่าที่ลูกค้ายังไม่เลือกเอง = ค่าเริ่มต้น (ลดการกด): ที่อยู่ default · จุดรับแรก + วันแรกที่รับได้
  const cfgOf = (b: BillDraft) => {
    const c = configs[b.key] ?? {};
    const orderType = c.orderType ?? b.defaultType;
    const base = addresses.find((a) => a._id === c.addressId) ?? addresses[0] ?? null;
    // แก้เฉพาะคำสั่งซื้อนี้ — ใช้ข้อความที่แก้แทน (ค่าส่งคิดจากจังหวัดที่แก้ด้วย) แต่ _id เดิมไว้ให้การ์ดรู้ว่าเลือกใบไหน
    const addressEdited = !!base && c.addressEdit?.baseId === base._id;
    const address = base && addressEdited ? { ...base, ...c.addressEdit!.fields } : base;
    const firstLoc = b.pickupLocations[0] ?? null;
    const pickupLocationId = c.pickupLocationId !== undefined ? c.pickupLocationId : (firstLoc?._id ?? null);
    const pickupDate = c.pickupDate !== undefined ? c.pickupDate : (firstLoc?.order_pickup_dates[0] ?? null);
    return { orderType, address, addressEdited, pickupLocationId, pickupDate };
  };
  const setCfg = (key: string, patch: BillConfig) => setConfigs((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  // ── ค่าส่งต่อบิล ──
  const quoteQs = useQueries({
    queries: bills.map((b) => {
      const cfg = cfgOf(b);
      const province = cfg.address?.province ?? "";
      return {
        queryKey: ["shop", "delivery-quote", b.kind, province, b.productIds],
        // สินค้าปกติ: ตรวจขอบเขตจัดส่งเฉพาะสินค้าที่เลือกสั่ง · พรีออเดอร์ส่งได้ทุกจังหวัด
        queryFn: (): Promise<DeliveryQuote> => shopOrdersService.deliveryQuote(province, b.productIds, { preorder: b.kind === "preorder" }),
        enabled: cfg.orderType === "delivery" && !!province,
      };
    }),
  });

  // รวมค่าส่ง — ที่อยู่เดียวกัน + วันรับห่างไม่เกิน 7 วัน → เก็บครั้งเดียวที่บิลที่รับเร็วสุด (กติกาเดียวกับ backend checkoutService)
  const combined = combinedShipping(
    bills.flatMap((b) => {
      const c = cfgOf(b);
      return c.orderType === "delivery" && c.address
        ? [{ key: b.key, address: c.address, date: b.basket ? bangkokYmd(new Date(b.basket.pickup_date)) : bangkokYmd(new Date()) }]
        : [];
    }),
  );
  const billNo = (key: string) => bills.findIndex((b) => b.key === key) + 1;

  // ค่าส่งของบิลนี้คิดได้แล้ว (ส่งถึง + ได้ราคา) — บิลที่เก็บค่าส่งแทนยังคิดไม่ได้ = ยังไม่ยกเว้นให้บิลที่รวม
  const quoteReady = (i: number) => quoteQs[i]?.data?.deliverable === true;
  const priced = bills.map((b, i) => {
    const cfg = cfgOf(b);
    const q = quoteQs[i];
    const isDelivery = cfg.orderType === "delivery";
    // บิลที่รวมค่าส่งกับบิลอื่น = ไม่เก็บ (ยังถามค่าส่งเพื่อตรวจว่าส่งถึงได้)
    const payer = isDelivery ? (combined.get(b.key) ?? null) : null;
    const combinedWith = payer && quoteReady(bills.findIndex((x) => x.key === payer)) ? payer : null;
    const fee = isDelivery && !combinedWith ? (q?.data?.fee ?? 0) : 0;
    const undeliverable = isDelivery && q?.data?.deliverable === false;
    const quoteLoading = isDelivery && !!cfg.address && !!q?.isLoading;
    // ถามค่าส่งไม่สำเร็จ = ยังไม่รู้ยอดจริง (backend คิดค่าส่งตอนสั่ง) → ห้ามสั่ง ไม่งั้นยอดที่ยืนยันไม่ตรงกับยอดชำระ
    const quoteFailed = isDelivery && !!cfg.address && !!q?.isError;
    const needsPickup = !isDelivery && b.pickupLocations.length > 0;
    const pickupOk =
      !needsPickup || (!!cfg.pickupDate && !!b.pickupLocations.find((l) => l._id === cfg.pickupLocationId)?.order_pickup_dates.includes(cfg.pickupDate));
    // พรีออเดอร์: รอบยังเปิด · สินค้ายังอยู่ในรอบ · จำนวนอยู่ในช่วง
    const activeIds = new Set((b.round?.items ?? []).map((it) => it._id));
    const missing = b.basket && b.round ? b.basket.items.filter((it) => !activeIds.has(it.round_item_id)) : [];
    const roundClosed = b.kind === "preorder" && !!b.round && !isRoundOpen(b.round, now);
    const qtyOk = !b.basket || b.basket.items.every((it) => it.quantity >= it.min_qty && it.quantity <= it.max_qty);
    const preorderOk = b.kind === "order" || (!!b.round && !roundClosed && missing.length === 0 && qtyOk);
    const methodOk = isDelivery ? !!cfg.address && !quoteLoading && !quoteFailed && !undeliverable : !pickupQ.isLoading && pickupOk;
    return { bill: b, cfg, fee, combinedWith, combinedWithNo: combinedWith ? billNo(combinedWith) : null, isDelivery, undeliverable, quoteLoading, quote: q, needsPickup, pickupOk, missing, roundClosed, qtyOk, preorderOk, methodOk };
  });

  // ── ส่วนลด: ใช้ได้บิลเดียว — เลือกบิลที่ลดได้มากสุด ──
  const promoKey = JSON.stringify(priced.map((p) => [p.bill.key, p.bill.subtotal, p.cfg.orderType, p.cfg.address?._id ?? null, p.fee]));
  const activePromo = promo && promo.forKey === promoKey ? promo : null;
  const coupons = couponsQ.data ?? [];
  const selectedCoupon = coupons.find((c) => c._id === couponId) ?? null;
  const couponBest = selectedCoupon
    ? priced
        .map((p) => ({ key: p.bill.key, amount: couponDiscount(selectedCoupon, p.bill.subtotal, p.fee).amount ?? 0 }))
        .reduce<{ key: string; amount: number } | null>((best, x) => (x.amount > (best?.amount ?? 0) ? x : best), null)
    : null;
  const discount = activePromo
    ? { billKey: activePromo.billKey, amount: activePromo.discount, label: t("discountCode", { code: activePromo.code }) }
    : selectedCoupon && couponBest
      ? { billKey: couponBest.key, amount: couponBest.amount, label: t("coupon", { code: selectedCoupon.promotion_code }) }
      : null;
  // คูปองที่เลือกได้ = เทียบกับบิลที่ยอดสูงสุด (ใบที่มีโอกาสผ่านขั้นต่ำมากสุด)
  const biggest = priced.reduce<(typeof priced)[number] | null>((m, p) => (!m || p.bill.subtotal > m.bill.subtotal ? p : m), null);

  const promoMutation = useMutation({
    mutationFn: async (code: string) => {
      const results = await Promise.allSettled(
        priced.map((p) =>
          p.bill.kind === "order"
            ? p.bill.allCart
              ? shopOrdersService.validatePromotion(code, p.fee)
              : shopOrdersService.validatePromotionForLines(
                  code,
                  pickedCart.map((it) => ({
                    product_id: typeof it.product_id === "object" && it.product_id ? it.product_id._id : String(it.product_id),
                    quantity: it.quantity,
                    line_total: it.line_total,
                  })),
                  p.fee,
                )
            : shopOrdersService.validatePromotionForLines(
                code,
                (p.bill.basket?.items ?? []).map((it) => ({ product_id: it.product_id, quantity: it.quantity, line_total: it.unit_price * it.quantity })),
                p.fee,
              ),
        ),
      );
      let best: { billKey: string; discount: number; code: string } | null = null;
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value.discount_amount > (best?.discount ?? 0)) {
          best = { billKey: priced[i].bill.key, discount: r.value.discount_amount, code: r.value.promotion_code };
        }
      });
      if (!best) {
        const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
        throw failed ? failed.reason : new Error(t("promoFailed"));
      }
      return best as { billKey: string; discount: number; code: string };
    },
    onSuccess: (r) => {
      setPromo({ ...r, forKey: promoKey });
      setCouponId(null); // โค้ดกับคูปองของฉันใช้พร้อมกันไม่ได้
      alert.success(t("promoApplied"));
    },
    onError: (e) => {
      setPromo(null);
      alert.error(isApiError(e) ? e.message : t("promoFailed"));
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: shopCheckoutService.checkout,
    onSuccess: (res, vars) => {
      if (vars.order) {
        // สั่งเฉพาะรายการที่เลือก — ที่เหลือยังอยู่ในตะกร้า ไอคอนตะกร้าใช้จำนวนจริงจาก backend
        void qc
          .fetchQuery({ queryKey: shopCartKey, queryFn: shopCartService.get, staleTime: 0 })
          .then((c) => setCount(c.summary?.item_count ?? c.items.length))
          .catch(() => qc.invalidateQueries({ queryKey: shopCartKey }));
        void qc.invalidateQueries({ queryKey: shopOrdersKey });
      }
      if (vars.preorders.length) {
        // เอาออกเฉพาะรายการที่สั่ง — ที่ไม่ได้เลือกยังอยู่ในตะกร้า
        removePreorderLines(
          baskets
            .filter((b) => vars.preorders.some((p) => p.round_id === b.round_id))
            .map((b) => ({ roundId: b.round_id, keys: b.items.map(basketLineKey) })),
        );
        void qc.invalidateQueries({ queryKey: shopPreordersKey });
        void qc.invalidateQueries({ queryKey: ["catalog", "preorder-rounds"] }); // โควตาเหลือเปลี่ยน
      }
      void qc.invalidateQueries({ queryKey: shopPointsKey });
      void qc.invalidateQueries({ queryKey: shopCouponsKey });
      if (res.group_id) router.replace(`${paymentGroupHref(res.group_id)}?new=1`);
      else if (res.bills[0]) router.replace(`${billHref(res.bills[0])}?new=1`);
    },
    onError: (e) => {
      alert.error(isApiError(e) ? e.message : t("orderFailed"));
      // คูปองอาจถูกใช้/หมดอายุ · โควตารอบเปลี่ยน — โหลดใหม่ให้ตรงกับ backend
      void qc.invalidateQueries({ queryKey: shopPointsKey });
      void qc.invalidateQueries({ queryKey: shopCouponsKey });
      void qc.invalidateQueries({ queryKey: shopCartKey });
      for (const q of roundQs) void q.refetch();
    },
  });

  if (cartQ.isLoading || addressesQ.isLoading) {
    return (
      <div className={`${shopPage} flex items-center justify-center`}>
        <ShopSpinner label={tc("loading")} />
      </div>
    );
  }

  // สั่งสำเร็จแล้ว รอพาไปหน้าชำระเงิน — ตะกร้าถูกล้าง/รายการที่ไม่ได้เลือกยังเหลือ ไม่ให้กระพริบเป็น "ตะกร้าว่าง"
  if (checkoutMutation.isSuccess) {
    return (
      <div className={`${shopPage} flex items-center justify-center`}>
        <ShopSpinner label={tc("loading")} />
      </div>
    );
  }

  if (bills.length === 0) {
    // มีของในตะกร้าแต่ไม่ได้ติ๊กเลือกเลย — บอกให้กลับไปเลือก (เดิมขึ้น "ไม่มีสินค้าในตะกร้า" ลูกค้างง)
    const hasUnselected = (cart?.items.length ?? 0) > 0 || allBaskets.some((b) => b.items.length > 0);
    return (
      <div className={`${shopPage} flex items-center justify-center px-4`}>
        <div className={`${shopCard} w-full max-w-md space-y-4 text-center`}>
          <h2 className="text-lg font-bold">{hasUnselected ? tcart("selectNone") : t("emptyCart")}</h2>
          <Link href={hasUnselected ? "/customer/cart" : "/customer/product"} className={`${shopButtonPrimary} w-full`}>
            {hasUnselected ? t("editCart") : tcart("browse")}
          </Link>
        </div>
      </div>
    );
  }

  const anyDelivery = priced.some((p) => p.isDelivery);
  const recipientOk = recipientName.trim().length > 0 && PHONE_RE.test(recipientPhone.trim());
  const totalOf = (p: (typeof priced)[number]) =>
    Math.max(0, round2(p.bill.subtotal + p.fee - (discount?.billKey === p.bill.key ? discount.amount : 0)));
  const grandTotal = round2(priced.reduce((s, p) => s + totalOf(p), 0));
  const canSubmit =
    priced.every((p) => p.methodOk && p.preorderOk) && (!anyDelivery || recipientOk) && !(promo && !activePromo) && !checkoutMutation.isPending;

  const submit = () => {
    if (!canSubmit) return;
    const methodFields = (p: (typeof priced)[number]) => {
      const out: Pick<
        CreateShopOrderInput,
        "address_id" | "recipient_name" | "recipient_phone" | "delivery_address" | "pickup_location_id" | "pickup_date"
      > = {};
      if (p.isDelivery && p.cfg.address) {
        const a = p.cfg.address;
        if (p.cfg.addressEdited) {
          // แก้เฉพาะคำสั่งซื้อนี้ → ส่งทั้งก้อน (backend ไม่แตะสมุดที่อยู่) · ส่ง address_id คู่กันไม่ได้
          out.delivery_address = {
            recipient_name: recipientName.trim(),
            recipient_phone: recipientPhone.trim(),
            house_no: a.house_no,
            sub_district: a.sub_district,
            district: a.district,
            province: a.province,
            zip_code: a.zip_code,
          };
        } else {
          out.address_id = a._id;
          out.recipient_name = recipientName.trim();
          out.recipient_phone = recipientPhone.trim();
        }
      }
      if (p.needsPickup && p.cfg.pickupLocationId && p.cfg.pickupDate) {
        out.pickup_location_id = p.cfg.pickupLocationId;
        out.pickup_date = p.cfg.pickupDate;
      }
      return out;
    };
    const discountFields = (key: string): Pick<CreateShopOrderInput, "promotion_code" | "user_coupon_id"> => {
      if (discount?.billKey !== key) return {};
      if (activePromo) return { promotion_code: activePromo.code };
      if (selectedCoupon && discount.amount > 0) return { user_coupon_id: selectedCoupon._id };
      return {};
    };
    const orderBill = priced.find((p) => p.bill.kind === "order");
    const order: CreateShopOrderInput | null = orderBill
      ? { order_type: orderBill.cfg.orderType, cart_item_ids: orderBill.bill.cartItemIds, ...methodFields(orderBill), ...discountFields(ORDER_KEY) }
      : null;
    const preorders: CreatePreorderInput[] = priced
      .filter((p) => p.bill.kind === "preorder" && p.bill.basket)
      .map((p) => ({
        round_id: p.bill.basket!.round_id,
        order_type: p.cfg.orderType,
        items: p.bill.basket!.items.map((it) => ({
          round_item_id: it.round_item_id,
          quantity: it.quantity,
          variant_ids: it.variant_ids,
          selected_options: it.options,
          special_request: it.special_request,
        })),
        ...methodFields(p),
        ...discountFields(p.bill.key),
      }));
    checkoutMutation.mutate({ order, preorders });
  };

  const many = bills.length > 1;

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px]">
        <CustomerBreadcrumb items={[{ label: tcart("title"), href: "/customer/cart" }, { label: t("confirmOrder") }]} className="!mb-0" />
        <FlowSteps current={2} />
        <div className="space-y-2">
          <h1 className="m-0 text-xl font-bold sm:text-2xl">{t("confirmOrder")}</h1>
          {many && <p className="m-0 rounded-xl bg-[#FAF6F0] p-3 text-sm text-[#4A342E]">{t("billsNotice", { n: bills.length })}</p>}
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            {priced.map((p, i) => (
              <BillCard
                key={p.bill.key}
                index={many ? i + 1 : null}
                p={p}
                addresses={addresses}
                pickupLoading={pickupQ.isLoading}
                addressFormOpen={addressFormFor === p.bill.key}
                onOpenAddressForm={() => {
                  setAddressEditFor(null);
                  setAddressFormFor(p.bill.key);
                }}
                onCloseAddressForm={() => setAddressFormFor(null)}
                addressEditOpen={addressEditFor === p.bill.key}
                onOpenAddressEdit={() => {
                  setAddressFormFor(null);
                  setAddressEditFor(p.bill.key);
                }}
                onCloseAddressEdit={() => setAddressEditFor(null)}
                onApplyAddressEdit={(fields) => {
                  setAddressEditFor(null);
                  if (p.cfg.address) setCfg(p.bill.key, { addressId: p.cfg.address._id, addressEdit: { baseId: p.cfg.address._id, fields } });
                }}
                onResetAddressEdit={() => setCfg(p.bill.key, { addressEdit: null })}
                onAddressCreated={(a) => {
                  setAddressFormFor(null);
                  setCfg(p.bill.key, { addressId: a._id });
                  void qc.invalidateQueries({ queryKey: shopAddressesKey });
                }}
                onChange={(patch) => setCfg(p.bill.key, patch)}
                onCopyFirst={
                  i > 0
                    ? () => {
                        const first = priced[0].cfg;
                        // วิธีรับ + ที่อยู่ + จุดรับ เหมือนบิลแรก (วันรับคนละรอบ — ใช้วันแรกที่จุดนั้นรับได้ของบิลนี้)
                        const loc = p.bill.pickupLocations.find((l) => l._id === first.pickupLocationId) ?? p.bill.pickupLocations[0] ?? null;
                        setCfg(p.bill.key, {
                          orderType: first.orderType,
                          addressId: first.address?._id,
                          // ที่อยู่ที่แก้เฉพาะคำสั่งซื้อนี้ของบิลแรกก็ใช้ตามด้วย
                          addressEdit: configs[priced[0].bill.key]?.addressEdit ?? null,
                          pickupLocationId: loc?._id ?? null,
                          pickupDate: loc?.order_pickup_dates[0] ?? null,
                        });
                      }
                    : null
                }
              />
            ))}

            {/* ผู้รับ — กรอกครั้งเดียว ใช้ทุกบิลที่จัดส่ง */}
            {anyDelivery && (
              <section className="space-y-3 rounded-2xl border border-[#8C5A3C]/15 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="m-0 text-base font-bold text-[#4A342E]">{many ? t("recipientTitleMany") : t("recipientTitle")}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
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
                    {recipientPhone && !PHONE_RE.test(recipientPhone) && <span className="text-xs text-red-600">{t("phoneInvalid")}</span>}
                  </label>
                </div>
              </section>
            )}
          </div>

          {/* สรุปยอดรวมทุกบิล */}
          <div className="lg:sticky lg:top-44 lg:col-span-5">
            <div className={`${shopCard} space-y-4`}>
              <h2 className="border-b border-[#8C5A3C]/10 pb-3 text-lg font-bold">{t("summary")}</h2>

              <div className="flex gap-2">
                <input
                  className={shopInput}
                  value={promoInput}
                  placeholder={t("promoCode")}
                  aria-label={t("promoCode")}
                  onChange={(e) => setPromoInput(normalizePromoCode(e.target.value))}
                />
                <button
                  type="button"
                  className={`${shopButton} shrink-0`}
                  disabled={!promoInput.trim() || promoMutation.isPending || priced.some((p) => p.quoteLoading)}
                  onClick={() => promoMutation.mutate(promoInput.trim())}
                >
                  {promoMutation.isPending ? t("checking") : t("applyCode")}
                </button>
              </div>
              {promo && !activePromo && (
                <p className="m-0 flex flex-wrap items-center gap-2 text-xs text-amber-700">
                  {t("reapplyCode")}
                  <button type="button" onClick={() => setPromo(null)} className="font-semibold underline">{tp("removeCode")}</button>
                </p>
              )}

              <CouponSelectBox
                coupons={coupons}
                selectedId={couponId}
                subtotal={biggest?.bill.subtotal ?? 0}
                deliveryFee={biggest?.fee ?? 0}
                onSelect={(id) => {
                  setCouponId(id);
                  if (id) setPromo(null); // คูปองของฉันกับโค้ดใช้พร้อมกันไม่ได้
                }}
              />
              {/* ใช้แต้มตอนสั่งซื้อไม่ได้แล้ว (2026-10-26) — แลกแต้มเป็นคูปองที่หน้าสมาชิก แล้วเลือกคูปองด้านบน */}
              <Link href="/customer/account/member?tab=redeem" className="block rounded-xl bg-[#FAF6F0] px-3 py-2 text-xs font-semibold text-[#8C5A3C] hover:underline">
                {tcart("redeemPointsHint")}
              </Link>

              <div className="space-y-3 text-sm">
                {priced.map((p, i) => (
                  <div key={p.bill.key} className={`space-y-1 ${many ? "rounded-xl border border-[#8C5A3C]/10 p-3" : ""}`}>
                    {many && <p className="m-0 font-bold text-[#4A342E]">{billTitle(p.bill, i + 1, t)}</p>}
                    <Line label={t("subtotal")} value={baht(p.bill.subtotal)} />
                    <Line
                      label={t("deliveryFee")}
                      value={
                        !p.isDelivery
                          ? baht(0)
                          : !p.cfg.address
                            ? t("pickAddressFirst")
                            : p.quoteLoading
                              ? t("calculating")
                              : p.quote?.isError
                                ? t("calcFailed")
                                : p.undeliverable
                                  ? t("cannotDeliver")
                                  : p.combinedWithNo
                                    ? t("shippingCombined", { n: p.combinedWithNo })
                                  : p.fee === 0
                                    ? t("free")
                                    : baht(p.fee)
                      }
                    />
                    {discount && discount.billKey === p.bill.key && discount.amount > 0 && <Line label={discount.label} value={`-${baht(discount.amount)}`} green />}
                    {many && <Line label={t("billTotal")} value={baht(totalOf(p))} bold />}
                  </div>
                ))}
              </div>

              <div className="flex items-baseline justify-between border-t border-[#8C5A3C]/10 pt-3">
                <span className="font-bold">{many ? t("grandTotal") : t("amountDue")}</span>
                <span className="text-2xl font-extrabold text-[#8C5A3C]">{baht(grandTotal)}</span>
              </div>
              <p className="m-0 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{many ? t("payOnceHint", { n: bills.length }) : t("payDeadline")}</p>

              <button type="button" className={`${shopButtonPrimary} w-full`} disabled={!canSubmit} onClick={submit}>
                {checkoutMutation.isPending ? t("ordering") : many ? t("confirmBills", { n: bills.length }) : t("confirmOrder")}
              </button>
              {anyDelivery && !recipientOk && <p className="m-0 text-center text-xs text-gray-500">{t("needRecipient")}</p>}
              {priced.some((p) => !p.methodOk && !p.isDelivery && p.needsPickup) && <p className="m-0 text-center text-xs text-gray-500">{t("needPickup")}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type Priced = {
  bill: BillDraft;
  /** เลขบิลที่เก็บค่าส่งแทนบิลนี้ (ส่งที่เดียวกันภายใน 7 วัน) · null = บิลนี้เก็บค่าส่งเอง */
  combinedWithNo: number | null;
  cfg: { orderType: OrderType; address: ShopAddress | null; addressEdited: boolean; pickupLocationId: string | null; pickupDate: string | null };
  isDelivery: boolean;
  undeliverable: boolean;
  quote: { data?: DeliveryQuote } | undefined;
  needsPickup: boolean;
  missing: PreorderBasket["items"];
  roundClosed: boolean;
  qtyOk: boolean;
};

function billTitle(b: BillDraft, index: number, t: ReturnType<typeof useTranslations<"shop.checkout">>): string {
  return b.kind === "order" ? t("billNormalTitle", { i: index }) : t("billPreorderTitle", { i: index, round: b.basket?.round_name ?? "" });
}

/** บิล 1 ใบ: รายการ + วิธีรับ (จัดส่ง: ที่อยู่ · รับเอง: จุดรับ/วันรับ) */
function BillCard({
  index,
  p,
  addresses,
  pickupLoading,
  addressFormOpen,
  onOpenAddressForm,
  onCloseAddressForm,
  onAddressCreated,
  addressEditOpen,
  onOpenAddressEdit,
  onCloseAddressEdit,
  onApplyAddressEdit,
  onResetAddressEdit,
  onChange,
  onCopyFirst,
}: {
  index: number | null;
  p: Priced;
  addresses: ShopAddress[];
  pickupLoading: boolean;
  addressFormOpen: boolean;
  onOpenAddressForm: () => void;
  onCloseAddressForm: () => void;
  onAddressCreated: (a: ShopAddress) => void;
  addressEditOpen: boolean;
  onOpenAddressEdit: () => void;
  onCloseAddressEdit: () => void;
  onApplyAddressEdit: (fields: AddressFields) => void;
  onResetAddressEdit: () => void;
  onChange: (patch: BillConfig) => void;
  onCopyFirst: (() => void) | null;
}) {
  const t = useTranslations("shop.checkout");
  const tp = useTranslations("shop.preorderShop");
  const tcart = useTranslations("shop.cart");
  const locale = useLocale();
  const { name: localName } = useLocalName();
  const { bill, cfg } = p;
  const Icon = bill.kind === "order" ? FaShoppingCart : FaCalendarCheck;
  // จัดส่งตามที่อยู่ = ซ้าย · รับเองที่จุดรับ = ขวา (ทุกบิล — ค่าเริ่มต้นของพรีออเดอร์ยังเป็นรับเองตาม defaultType)
  const methods =
    bill.kind === "order"
      ? ([["delivery", t("delivery"), t("deliveryHint")], ["takeaway", t("takeaway"), t("takeawayHint")]] as const)
      : ([["delivery", t("delivery"), t("deliveryHint")], ["takeaway", tp("takeaway"), tp("takeawayHint")]] as const);

  const title = index ? billTitle(bill, index, t) : bill.kind === "order" ? tcart("normalSection") : `${tcart("preorderSection")} · ${bill.basket?.round_name ?? ""}`;
  const subtitle = bill.basket ? tp("pickupFrom", { date: thaiDate(bill.basket.pickup_date, false, locale) }) : tcart("normalSubtitle");
  const MethodIcon = { delivery: FaTruck, takeaway: FaStore } as const;

  // การ์ดแบบเดียวกับหน้าตะกร้า: หัวบิล (แถบครีม) · แถวสินค้า · วิธีรับสินค้าของบิลนี้
  return (
    <section className="overflow-hidden rounded-2xl border border-[#8C5A3C]/15 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#8C5A3C]/10 bg-[#FAF6F0]/80 px-4 py-3 sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm text-[#8C5A3C] shadow-sm">
          <Icon aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 truncate text-base font-bold text-[#4A342E]">
            {title} <span className="text-sm font-medium text-stone-500">{tcart("itemCount", { n: bill.lines.length })}</span>
          </h2>
          <p className="m-0 truncate text-xs text-stone-500">{subtitle}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="m-0 text-sm font-bold text-[#4A342E]">{baht(bill.subtotal)}</p>
          <Link href="/customer/cart" className="text-[11px] font-semibold text-[#8C5A3C] hover:underline">{t("editCart")}</Link>
        </div>
      </div>

      {(bill.roundError || p.roundClosed || p.missing.length > 0 || !p.qtyOk) && (
        <div className="space-y-2 border-b border-[#8C5A3C]/10 px-4 py-3 sm:px-5">
          {bill.roundError && <p className="m-0 rounded-xl bg-red-50 p-3 text-sm text-red-700">{tp("roundFailed")}</p>}
          {p.roundClosed && bill.basket && <p className="m-0 rounded-xl bg-red-50 p-3 text-sm text-red-700">{tp("roundClosed", { round: bill.basket.round_name })}</p>}
          {p.missing.length > 0 && (
            <p className="m-0 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {tp("itemsGone", { names: p.missing.map((m) => localName(m.product_name_th, m.product_name_eng)).join(", ") })}
            </p>
          )}
          {!p.qtyOk && <p className="m-0 rounded-xl bg-red-50 p-3 text-sm text-red-700">{tp("qtyOutOfRange")}</p>}
        </div>
      )}

      <ul className="m-0 list-none divide-y divide-[#8C5A3C]/10 p-0">
        {bill.lines.map((l) => (
          <li key={l.key} className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#FAF6F0] ring-1 ring-[#8C5A3C]/10">
              {l.img ? (
                <ShopImage src={l.img} alt={l.name} width={128} height={128} sizes="64px" className="h-full w-full object-cover" />
              ) : (
                <FaImage className="text-xl text-[#8C5A3C]/40" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="m-0 line-clamp-2 text-sm font-semibold leading-snug text-[#4A342E]">{l.name}</p>
              {l.options && <p className="m-0 line-clamp-1 text-xs text-stone-500">{l.options}</p>}
              <p className="m-0 text-xs text-stone-500">{tcart("qtyTimesPrice", { qty: l.quantity, price: baht(l.unitPrice) })}</p>
            </div>
            <span className="shrink-0 text-sm font-extrabold text-[#8C5A3C]">{baht(l.total)}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-3 border-t border-[#8C5A3C]/10 bg-[#FAF6F0]/30 px-4 pb-5 pt-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="m-0 text-sm font-bold text-[#4A342E]">{t("receiveMethod")}</h3>
          {onCopyFirst && (
            <button type="button" onClick={onCopyFirst} className="rounded-full border border-[#8C5A3C]/25 bg-white px-3 py-1 text-xs font-semibold text-[#8C5A3C] hover:bg-[#FAF6F0]">
              {t("sameAsFirst")}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("receiveMethod")}>
          {methods.map(([value, label, hint]) => {
            const MIcon = MethodIcon[value];
            const on = cfg.orderType === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange({ orderType: value })}
                className={`flex items-start gap-2.5 rounded-2xl border-2 bg-white p-3 text-left transition ${
                  on ? "border-[#8C5A3C] shadow-sm" : "border-transparent ring-1 ring-[#8C5A3C]/15 hover:ring-[#8C5A3C]/40"
                }`}
              >
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${on ? "bg-[#8C5A3C] text-white" : "bg-[#FAF6F0] text-[#8C5A3C]"}`}>
                  <MIcon aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#4A342E]">{label}</span>
                  <span className="block text-xs text-stone-500">{hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        {p.isDelivery && (
          <div className="space-y-3 pb-2 pt-1">
            {p.combinedWithNo && !p.undeliverable && (
              <p className="m-0 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{t("shippingCombinedHint", { n: p.combinedWithNo })}</p>
            )}
            {p.undeliverable && (
              <p className="m-0 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {t("undeliverable", { reason: p.quote?.data?.message ?? t("undeliverableDefault") })}
              </p>
            )}
            <p className="m-0 text-xs font-semibold text-stone-600">{t("deliveryAddress")}</p>
            {addresses.length === 0 && !addressFormOpen && <p className="m-0 text-sm text-gray-600">{t("noAddress")}</p>}
            {/* เลือกที่อยู่แบบการ์ด (กดเลือกได้ทันที ไม่ต้องเปิด dropdown)
                การ์ดที่เลือก = มีปุ่ม "แก้ไข" ในการ์ด → ฟอร์มเปิดในการ์ดเดียวกัน · แก้เฉพาะคำสั่งซื้อนี้ ไม่บันทึกลงสมุดที่อยู่
                (ปุ่มแก้ไขเป็นพี่น้องกับปุ่มเลือก ไม่ซ้อนกัน — <button> ซ้อน <button> ไม่ได้) */}
            {addresses.length > 0 && (
              <div className="space-y-2" role="radiogroup" aria-label={t("deliveryAddress")}>
                {addresses.map((saved) => {
                  const on = cfg.address?._id === saved._id;
                  // ใบที่เลือกและแก้เฉพาะคำสั่งซื้อนี้ = แสดงข้อความที่แก้
                  const a = on && cfg.addressEdited && cfg.address ? cfg.address : saved;
                  const editing = on && addressEditOpen;
                  return (
                    <div
                      key={saved._id}
                      className={`overflow-hidden rounded-2xl border-2 bg-white text-sm transition ${
                        on ? "border-[#8C5A3C] shadow-sm" : "border-transparent ring-1 ring-[#8C5A3C]/15 hover:ring-[#8C5A3C]/40"
                      }`}
                    >
                      <div className="flex items-start gap-2 p-3">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => onChange({ addressId: saved._id })}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left"
                        >
                          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${on ? "bg-[#8C5A3C] text-white" : "bg-[#FAF6F0] text-[#8C5A3C]"}`}>
                            <FaMapMarkerAlt aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1 leading-relaxed text-[#4A342E]">
                            {formatAddress(a)}
                            {a.is_default && (
                              <span className="ml-2 inline-block rounded-full bg-[#8C5A3C]/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-[#8C5A3C]">
                                {t("default")}
                              </span>
                            )}
                            {on && cfg.addressEdited && (
                              <span className="ml-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 align-middle text-[11px] font-semibold text-amber-700">
                                {t("addressEditedBadge")}
                              </span>
                            )}
                          </span>
                        </button>
                        {on && !editing ? (
                          <button
                            type="button"
                            onClick={onOpenAddressEdit}
                            aria-label={t("editAddressOnce")}
                            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[#8C5A3C]/25 bg-white px-3 text-xs font-semibold text-[#8C5A3C] hover:bg-[#FAF6F0]"
                          >
                            <FaPen className="text-[10px]" aria-hidden="true" />
                            {t("editShort")}
                          </button>
                        ) : (
                          on && <FaCheckCircle className="mt-1 shrink-0 text-[#8C5A3C]" aria-hidden="true" />
                        )}
                      </div>
                      {on && cfg.addressEdited && !editing && (
                        <div className="border-t border-[#8C5A3C]/10 bg-[#FAF6F0]/50 px-3 py-2 text-xs">
                          <button type="button" onClick={onResetAddressEdit} className="font-semibold text-stone-500 hover:underline">
                            {t("useSavedAddress")}
                          </button>
                        </div>
                      )}
                      {editing && cfg.address && (
                        <div className="border-t border-[#8C5A3C]/10 bg-[#FAF6F0]/40 p-3">
                          <CheckoutAddressForm
                            key={`${cfg.address._id}-${cfg.addressEdited ? "edited" : "saved"}`}
                            initial={{
                              house_no: cfg.address.house_no,
                              sub_district: cfg.address.sub_district,
                              district: cfg.address.district,
                              province: cfg.address.province,
                              zip_code: cfg.address.zip_code,
                            }}
                            onApply={onApplyAddressEdit}
                            onCancel={onCloseAddressEdit}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {addressFormOpen ? (
              <CheckoutAddressForm onCancel={onCloseAddressForm} onCreated={onAddressCreated} />
            ) : (
              <button
                type="button"
                onClick={onOpenAddressForm}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#8C5A3C]/25 bg-white/60 p-3 text-sm font-semibold text-[#8C5A3C] transition hover:border-[#8C5A3C]/50 hover:bg-white"
              >
                {t("addAddress")}
              </button>
            )}
          </div>
        )}

        {!p.isDelivery &&
          (pickupLoading ? (
            <p className="m-0 text-sm text-gray-500">{t("loadingPickup")}</p>
          ) : bill.pickupLocations.length > 0 ? (
            <PickupLocationPicker
              locations={bill.pickupLocations}
              locationId={cfg.pickupLocationId}
              date={cfg.pickupDate}
              onChange={(id, d) => onChange({ pickupLocationId: id, pickupDate: d })}
            />
          ) : bill.basket ? (
            <p className="m-0 rounded-xl bg-white p-3 text-sm text-gray-700 ring-1 ring-[#8C5A3C]/10">{tp("pickupAtStore", { date: thaiDate(bill.basket.pickup_date, false, locale) })}</p>
          ) : null)}
      </div>
    </section>
  );
}

function Line({ label, value, green, bold }: { label: string; value: string; green?: boolean; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${green ? "text-green-700" : "text-gray-600"} ${bold ? "font-bold" : ""}`}>
      <span className="min-w-0">{label}</span>
      <span className={`shrink-0 font-semibold ${green ? "" : "text-[#4A342E]"}`}>{value}</span>
    </div>
  );
}
