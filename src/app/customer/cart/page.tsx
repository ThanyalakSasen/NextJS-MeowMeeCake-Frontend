"use client";
// ─────────────────────────────────────────────────────────────
// ตะกร้าสินค้า — แทน FrontOffice customer/cart/page.tsx (เขียนใหม่บน /shop/cart ของ backend หลัก)
// แก้จำนวน = PATCH /shop/cart/items/{id} (backend ตรวจสต็อกแล้วตอบข้อความเอง) · ลบ = DELETE
// ตัดออก (backend ยังไม่รองรับ): แพ็กเกจ/เซ็ตขนม · ตัวเลือกสินค้าหลายตัว · หมายเหตุต่อชิ้น
// รายการที่ซื้อไม่ได้ (ปิดขาย · หมด · สต็อกไม่พอ — สต็อกจาก /catalog/products/:id) แสดงต่อบรรทัด + ปิดปุ่มสั่งซื้อ (U6 · lib/cartIssues)
// backend ตรวจซ้ำตอนกดสั่งซื้อเสมอ · ช่องค้นหาอยู่ใน Navbar หน้าร้านแล้ว (FrontOffice ซ่อน Navbar ในตะกร้าเลยมีช่องแยก)
// ตะกร้ารวม (2026-10-27): สินค้าปกติ + พรีออเดอร์ทุกรอบ (localStorage · preorderBasket) ในหน้าเดียว
// ปุ่มสั่งซื้อปุ่มเดียว → /customer/checkout (POST /shop/checkout) — ได้หลายบิล: 1 ปกติ + 1 ต่อรอบ · ชำระรวมครั้งเดียว
// ติ๊กเลือกรายการ/ทั้งบิลที่จะสั่ง (lib/cartSelection) — ที่ไม่ได้เลือกยังอยู่ในตะกร้าหลังสั่ง
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useLocalName } from "@/app/customer/lib/localName";
import { FaCalendarCheck, FaImage, FaShoppingCart, FaTrashAlt } from "react-icons/fa";
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
import FlowSteps from "@/components/customer/FlowSteps";
import ShopImage from "@/components/customer/ShopImage";
import ShopSpinner from "@/components/customer/ShopSpinner";
import {
  basketLineKey, removePreorderBasketItem, updatePreorderBasketItem, usePreorderBaskets, type PreorderBasket,
} from "../preorder/lib/preorderBasket";
import { thaiDate } from "../preorder/lib/preorderDates";
import { preorderSelectKey, useCartSelection } from "../lib/cartSelection";
import BackButton from "../account/_components/BackButton";

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
  const baskets = usePreorderBaskets();
  const sel = useCartSelection();

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
        <ShopSpinner label={tc("loading")} />
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
  const hasNormal = cart.items.length > 0;
  // ตะกร้ารวม (2026-10-27): สินค้าปกติ + พรีออเดอร์ทุกรอบในหน้าเดียว · สั่งครั้งเดียว = หลายบิล (1 ปกติ + 1 ต่อรอบ)
  // ติ๊กเลือกได้ว่าจะสั่งรายการไหน/บิลไหน — ไม่ได้เลือก = ยังอยู่ในตะกร้า (lib/cartSelection)
  const pickedNormal = cart.items.filter((it) => sel.isSelected(it._id));
  const pickedBaskets = baskets
    .map((b) => ({ ...b, items: b.items.filter((it) => sel.isSelected(preorderSelectKey(b.round_id, basketLineKey(it)))) }))
    .filter((b) => b.items.length > 0);
  const billCount = (pickedNormal.length > 0 ? 1 : 0) + pickedBaskets.length;
  const totalBills = (hasNormal ? 1 : 0) + baskets.length;
  const lineCount = cart.items.length + baskets.reduce((s, b) => s + b.items.length, 0);
  const pickedLineCount = pickedNormal.length + pickedBaskets.reduce((s, b) => s + b.items.length, 0);
  const pickedNormalTotal = pickedNormal.reduce((s, it) => s + it.line_total, 0);
  const pickedNormalQty = pickedNormal.reduce((s, it) => s + it.quantity, 0);
  const grandTotal = Math.round((pickedNormalTotal + pickedBaskets.reduce((s, b) => s + basketTotal(b), 0)) * 100) / 100;
  // ติดปัญหาเฉพาะรายการที่เลือกสั่ง (ไม่เลือก = ไม่กันการสั่ง)
  const blocking = pickedNormal.filter((it) => issues.has(it._id)).length;
  const allNormalOn = pickedNormal.length === cart.items.length;

  return (
    <div className={shopPage}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-[20px] sm:px-[32px] md:px-[40px] xl:px-[64px]">
        <CustomerBreadcrumb items={[{ label: t("title") }]} className="!mb-0" />
        {totalBills > 0 && <FlowSteps current={1} />}

        {totalBills === 0 ? (
          <div className={`${shopCard} mx-auto w-full max-w-md space-y-4 text-center`}>
            <h2 className="text-lg font-bold">{t("empty")}</h2>
            <Link href="/customer/product" className={`${shopButtonPrimary} w-full`}>
              {t("browse")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">
                  {t("title")} <span className="text-sm font-medium text-gray-500">{t("itemCount", { n: lineCount })}</span>
                </h1>
                {/* ปุ่มกลับแบบเดียวกับทุกหน้าฝั่งลูกค้า (ไม่มีลูกศร) · เปิดตะกร้าจากลิงก์ตรง = ไปหน้าสินค้าทั้งหมด */}
                <BackButton fallback="/customer/product" className="cursor-pointer border-none bg-transparent p-0 text-sm font-semibold text-[#8C5A3C] hover:text-[#4A342E]" />
              </div>

              {/* ── สินค้าปกติ (บิลที่ 1) — การ์ดเดียว แถวละสินค้า ── */}
              {hasNormal && (
                <BillGroup
                  icon={<FaShoppingCart aria-hidden="true" />}
                  title={t("normalSection")}
                  count={cart.items.length}
                  subtitle={t("normalSubtitle")}
                  selectedCount={pickedNormal.length}
                  selectedTotal={pickedNormalTotal}
                  onToggleAll={() => sel.setSelected(cart.items.map((it) => it._id), !allNormalOn)}
                >
                  {cart.items.map((item) => {
                    const product = productOf(item);
                    const issue = issues.get(item._id);
                    const busy = busyId === item._id;
                    const name = product ? localName(product.product_name_th, product.product_name_eng) : t("product");
                    return (
                      <CartLine
                        key={item._id}
                        name={name}
                        href={product ? `/customer/product/${product._id}` : null}
                        img={resolveUploadUrl(product?.product_img?.[0])}
                        options={cartItemOptionText(item) || null}
                        unitPrice={item.price_snapshot}
                        quantity={item.quantity}
                        lineTotal={item.line_total}
                        selected={sel.isSelected(item._id)}
                        onToggle={() => sel.toggle(item._id)}
                        busy={busy}
                        issue={issue ? cartIssueText(issue, t) : null}
                        decDisabled={busy || item.quantity <= 1}
                        incDisabled={busy}
                        onDec={() => qtyMutation.mutate({ id: item._id, qty: item.quantity - 1 })}
                        onInc={() => qtyMutation.mutate({ id: item._id, qty: item.quantity + 1 })}
                        onRemove={() => removeMutation.mutate(item._id)}
                      />
                    );
                  })}
                </BillGroup>
              )}

              {/* ── พรีออเดอร์ (1 รอบ = 1 บิล) ── */}
              {baskets.map((b) => (
                <PreorderSection key={b.round_id} basket={b} sel={sel} />
              ))}
            </div>

            {/* สรุปรวมทุกบิล — ปุ่มสั่งซื้อปุ่มเดียว */}
            <div className="lg:sticky lg:top-44 lg:col-span-4">
              <div className={`${shopCard} space-y-4`}>
                <h2 className="flex items-center gap-2 border-b border-[#8C5A3C]/10 pb-3 text-lg font-bold">
                  <FaShoppingCart className="text-base text-[#8C5A3C]" aria-hidden="true" />
                  {t("summary")}
                </h2>
                <div className="space-y-2 text-sm">
                  {pickedNormal.length > 0 && (
                    <div className="flex justify-between gap-3 text-gray-600">
                      <span>{t("billNormal", { n: pickedNormalQty })}</span>
                      <span className="shrink-0 font-semibold text-[#4A342E]">{baht(pickedNormalTotal)}</span>
                    </div>
                  )}
                  {pickedBaskets.map((b) => (
                    <div key={b.round_id} className="flex justify-between gap-3 text-gray-600">
                      <span className="min-w-0">{t("billPreorder", { round: b.round_name, n: basketQty(b) })}</span>
                      <span className="shrink-0 font-semibold text-[#4A342E]">{baht(basketTotal(b))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-gray-600">
                    <span>{t("deliveryFee")}</span>
                    <span className="italic text-[#8C5A3C]">{t("nextStep")}</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between border-t border-[#8C5A3C]/10 pt-3">
                  <span className="font-bold">{t("itemsTotal")}</span>
                  <span className="text-xl font-extrabold text-[#8C5A3C]">{baht(grandTotal)}</span>
                </div>
                {billCount === 0 ? (
                  <>
                    <p className="rounded-xl bg-[#FAF6F0] p-3 text-sm text-[#4A342E]">{t("selectNone")}</p>
                    <button type="button" disabled className={`${shopButtonPrimary} w-full`}>
                      {t("checkout")}
                    </button>
                  </>
                ) : blocking > 0 ? (
                  <>
                    <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{t("blocked", { n: blocking })}</p>
                    <button type="button" disabled className={`${shopButtonPrimary} w-full`}>
                      {t("checkout")}
                    </button>
                  </>
                ) : (
                  <Link href="/customer/checkout" className={`${shopButtonPrimary} w-full`}>
                    {billCount > 1 ? t("checkoutBills", { n: billCount }) : t("checkout")}
                  </Link>
                )}
                <p className="text-center text-xs text-gray-500">{billCount > 1 ? t("billsHint", { n: billCount }) : t("payHint")}</p>
                {billCount > 0 && pickedLineCount < lineCount && (
                  <p className="m-0 text-center text-xs text-gray-500">{t("unselectedStay", { n: lineCount - pickedLineCount })}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const basketQty = (b: PreorderBasket) => b.items.reduce((n, it) => n + it.quantity, 0);
const basketTotal = (b: PreorderBasket) => b.items.reduce((n, it) => n + it.unit_price * it.quantity, 0);

/** รายการพรีออเดอร์ของ 1 รอบ (= 1 บิล) — แก้จำนวน (ในขั้นต่ำ–สูงสุดของรอบ) / ลบ / ติ๊กเลือก · หมายเหตุพิเศษแก้ที่หน้าสินค้า */
function PreorderSection({ basket, sel }: { basket: PreorderBasket; sel: ReturnType<typeof useCartSelection> }) {
  const t = useTranslations("shop.cart");
  const locale = useLocale();
  const { name: localName } = useLocalName();
  const keyOf = (it: PreorderBasket["items"][number]) => preorderSelectKey(basket.round_id, basketLineKey(it));
  const picked = basket.items.filter((it) => sel.isSelected(keyOf(it)));
  const allOn = picked.length === basket.items.length;
  return (
    <BillGroup
      icon={<FaCalendarCheck aria-hidden="true" />}
      title={`${t("preorderSection")} · ${basket.round_name}`}
      count={basket.items.length}
      subtitle={t("preorderPickup", { date: thaiDate(basket.pickup_date, false, locale) })}
      selectedCount={picked.length}
      selectedTotal={basketTotal({ ...basket, items: picked })}
      onToggleAll={() => sel.setSelected(basket.items.map(keyOf), !allOn)}
    >
      {basket.items.map((it) => {
        const key = basketLineKey(it);
        const selKey = keyOf(it);
        return (
          <CartLine
            key={key}
            name={localName(it.product_name_th, it.product_name_eng)}
            href={`/customer/product/${it.product_id}?round=${basket.round_id}`}
            img={resolveUploadUrl(it.product_img)}
            options={it.option_text}
            badges={
              <>
                <span className="rounded-full bg-[#8C5A3C]/10 px-2 py-0.5 text-[11px] font-semibold text-[#8C5A3C]">{t("preorderBadge")}</span>
                {it.min_qty > 1 && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">{t("preorderMinQty", { n: it.min_qty })}</span>}
              </>
            }
            unitPrice={it.unit_price}
            quantity={it.quantity}
            lineTotal={it.unit_price * it.quantity}
            selected={sel.isSelected(selKey)}
            onToggle={() => sel.toggle(selKey)}
            decDisabled={it.quantity <= Math.max(1, it.min_qty)}
            incDisabled={it.quantity >= it.max_qty}
            onDec={() => updatePreorderBasketItem(basket.round_id, key, { quantity: it.quantity - 1 })}
            onInc={() => updatePreorderBasketItem(basket.round_id, key, { quantity: it.quantity + 1 })}
            onRemove={() => removePreorderBasketItem(basket.round_id, key)}
          />
        );
      })}
    </BillGroup>
  );
}

/** ช่องติ๊กที่มีสถานะ "เลือกบางส่วน" (หัวบิล) */
function TriCheckbox({ checked, partial, onChange, label }: { checked: boolean; partial: boolean; onChange: () => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = partial;
  }, [partial]);
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="h-5 w-5 shrink-0 cursor-pointer accent-[#4A342E]" />;
}

/** การ์ดของ 1 บิล — หัว (ติ๊กทั้งบิล · ชื่อ · ยอดที่เลือก) + แถวสินค้าคั่นด้วยเส้น */
function BillGroup({
  icon,
  title,
  count,
  subtitle,
  selectedCount,
  selectedTotal,
  onToggleAll,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  subtitle: string;
  selectedCount: number;
  selectedTotal: number;
  onToggleAll: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslations("shop.cart");
  return (
    <section className="overflow-hidden rounded-2xl border border-[#8C5A3C]/15 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#8C5A3C]/10 bg-[#FAF6F0]/80 px-4 py-3 sm:px-5">
        <TriCheckbox
          checked={selectedCount === count}
          partial={selectedCount > 0 && selectedCount < count}
          onChange={onToggleAll}
          label={t("selectBill", { name: title })}
        />
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm text-[#8C5A3C] shadow-sm">{icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 truncate text-base font-bold text-[#4A342E]">
            {title} <span className="text-sm font-medium text-stone-500">{t("itemCount", { n: count })}</span>
          </h2>
          <p className="m-0 truncate text-xs text-stone-500">{subtitle}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="m-0 text-[11px] text-stone-500">{t("selectedOf", { n: selectedCount, total: count })}</p>
          <p className="m-0 text-sm font-bold text-[#4A342E]">{baht(selectedTotal)}</p>
        </div>
      </div>
      <ul className="m-0 list-none divide-y divide-[#8C5A3C]/10 p-0">{children}</ul>
    </section>
  );
}

/** แถวสินค้า 1 รายการ: ติ๊ก · รูป · ชื่อ/ตัวเลือก/ป้าย · ตัวปรับจำนวน · ยอด · ลบ */
function CartLine({
  name,
  href,
  img,
  options,
  badges,
  unitPrice,
  quantity,
  lineTotal,
  selected,
  onToggle,
  busy = false,
  issue = null,
  decDisabled,
  incDisabled,
  onDec,
  onInc,
  onRemove,
}: {
  name: string;
  href: string | null;
  img: string | null | undefined;
  options: string | null;
  badges?: React.ReactNode;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  selected: boolean;
  onToggle: () => void;
  busy?: boolean;
  issue?: string | null;
  decDisabled: boolean;
  incDisabled: boolean;
  onDec: () => void;
  onInc: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations("shop.cart");
  const image = (
    <span className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#FAF6F0] ring-1 ring-[#8C5A3C]/10 sm:h-24 sm:w-24 ${selected ? "" : "grayscale"}`}>
      {img ? (
        <ShopImage src={img} alt={name} width={192} height={192} sizes="96px" className="h-full w-full object-cover" />
      ) : (
        <FaImage className="text-2xl text-[#8C5A3C]/40" aria-hidden="true" />
      )}
    </span>
  );
  return (
    <li className={`flex gap-3 px-4 py-4 transition sm:gap-4 sm:px-5 ${busy ? "pointer-events-none opacity-60" : ""} ${issue && selected ? "bg-red-50/40" : ""}`}>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={t("selectItem", { name })}
          className="h-5 w-5 shrink-0 cursor-pointer accent-[#4A342E]"
        />
      </div>
      {href ? (
        <Link href={href} className="shrink-0" tabIndex={-1} aria-hidden="true">
          {image}
        </Link>
      ) : (
        <span className="shrink-0">{image}</span>
      )}

      <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${selected ? "" : "opacity-60"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            {href ? (
              <Link href={href} className="line-clamp-2 font-semibold leading-snug text-[#4A342E] hover:text-[#8C5A3C]">
                {name}
              </Link>
            ) : (
              <p className="m-0 line-clamp-2 font-semibold leading-snug text-[#4A342E]">{name}</p>
            )}
            {options && <p className="m-0 line-clamp-2 text-xs text-stone-500">{options}</p>}
            {badges && <div className="flex flex-wrap gap-1.5">{badges}</div>}
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            aria-label={t("removeItem", { name })}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          >
            <FaTrashAlt className="text-sm" />
          </button>
        </div>

        {issue && selected && (
          <p className="m-0 self-start rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">{issue}</p>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-1">
          <div className="flex items-center rounded-full border border-[#8C5A3C]/20 bg-[#FAF6F0]">
            <button
              type="button"
              onClick={onDec}
              disabled={decDisabled}
              aria-label={t("decrease")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-[#8C5A3C] transition hover:bg-white disabled:opacity-30"
            >
              −
            </button>
            <span className="w-9 text-center text-sm font-bold tabular-nums text-[#4A342E]" aria-live="polite">{quantity}</span>
            <button
              type="button"
              onClick={onInc}
              disabled={incDisabled}
              aria-label={t("increase")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-[#8C5A3C] transition hover:bg-white disabled:opacity-30"
            >
              +
            </button>
          </div>
          <div className="text-right">
            <p className="m-0 text-base font-extrabold text-[#8C5A3C]">{baht(lineTotal)}</p>
            <p className="m-0 text-[11px] text-stone-500">{t("qtyTimesPrice", { qty: quantity, price: baht(unitPrice) })}</p>
          </div>
        </div>
      </div>
    </li>
  );
}
