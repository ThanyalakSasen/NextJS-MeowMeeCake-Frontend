"use client";
// ─────────────────────────────────────────────────────────────
// useEditCheckout — "แก้ไขวิธีรับสินค้า / ที่อยู่จัดส่ง" หลังกดสั่ง (ยังไม่ชำระ · ยังไม่ส่งสลิป)
// บิลถูกสร้างไปแล้วตอนกดสั่ง → แก้ = ยกเลิกบิล (backend คืนสต็อก/โควตาในรอบ + คูปอง/แต้ม/โปรให้เอง)
//   แล้วใส่สินค้าเดิมกลับ: คำสั่งซื้อปกติ → ตะกร้า (useBuyAgain) · พรีออเดอร์ → ตะกร้าพรีออเดอร์ (preorderBasket)
//   → กลับหน้ายืนยันคำสั่งซื้อ (/customer/checkout) ให้เลือกที่อยู่/วิธีรับใหม่
// สั่งหลายบิลพร้อมกัน (ตะกร้ารวม · payment group) เลือกที่อยู่/วิธีรับครั้งเดียวสำหรับทุกบิล
//   → แก้จากบิลไหนก็ยกเลิก + ใส่กลับทุกบิลในกลุ่มที่ยังแก้ได้ (ไม่งั้นบิลที่เหลือค้างอยู่ด้วยที่อยู่เดิม)
// พรีออเดอร์แก้ได้เฉพาะตอนรอบยังเปิดรับ — รอบปิดแล้วยกเลิกไปจะสั่งใหม่ไม่ได้
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { canCustomerCancel, shopOrdersService, type ShopOrder } from "@/services/shopOrders";
import { canCustomerCancelPreorder, roundItemLimits, shopPreordersService, type ShopPreorder } from "@/services/shopPreorders";
import { shopCheckoutService } from "@/services/shopCheckout";
import { alert, confirmAlert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { useBuyAgain } from "./useBuyAgain";
import { addToPreorderBasket } from "../preorder/lib/preorderBasket";
import { isRoundOpen } from "../preorder/lib/useNow";
import {
  paymentGroupKey,
  shopCouponsKey,
  shopOrdersAllKey,
  shopPointsKey,
  shopPreordersAllKey,
} from "../lib/shopQueries";

export type EditBill = { kind: "order"; doc: ShopOrder } | { kind: "preorder"; doc: ShopPreorder };

/** บิลนี้ยังแก้วิธีรับ/ที่อยู่ได้ไหม — รอชำระ · ยังไม่ส่งสลิป · ร้านยังไม่รับ · (พรีออเดอร์) รอบยังเปิดรับ */
export function canEditBill(b: EditBill, now: number): boolean {
  const d = b.doc;
  if (d.order_status !== "pending" || d.payment_status === "paid" || d.has_payment) return false;
  if (b.kind === "order") return canCustomerCancel(b.doc);
  return canCustomerCancelPreorder(b.doc) && !!b.doc.round && isRoundOpen(b.doc.round, now);
}

/** ทุกบิลในกลุ่ม (สั่งพร้อมกัน) ที่ยังแก้ได้ */
async function loadGroupBills(groupId: string): Promise<EditBill[]> {
  const group = await shopCheckoutService.paymentGroup(groupId);
  const bills = await Promise.all(
    group.bills.map(async (b): Promise<EditBill | null> => {
      try {
        return b.kind === "order"
          ? { kind: "order", doc: await shopOrdersService.get(b.id) }
          : { kind: "preorder", doc: await shopPreordersService.get(b.id) };
      } catch {
        return null;
      }
    }),
  );
  const now = Date.now();
  return bills.filter((b): b is EditBill => !!b && canEditBill(b, now));
}

export function useEditCheckout() {
  const t = useTranslations("shop.flow");
  const qc = useQueryClient();
  const router = useRouter();
  const { addItemsToCart } = useBuyAgain();
  const [busy, setBusy] = useState(false);

  /** ใส่สินค้าของพรีออเดอร์ (ที่ยกเลิกแล้ว) กลับลงตะกร้าพรีออเดอร์ — อ่านรอบหลังยกเลิก: โควตาที่คืนแล้วนับใน remaining_qty */
  const restorePreorder = async (p: ShopPreorder): Promise<{ added: number; failed: string[] }> => {
    const round = p.round;
    if (!round) return { added: 0, failed: p.items.map((it) => it.product_name) };
    const detail = await shopPreordersService.round(round._id).catch(() => null);
    const roundItems = new Map((detail?.items ?? []).map((ri) => [ri._id, ri]));
    const failed: string[] = [];
    let added = 0;
    for (const it of p.items) {
      const ri = it.round_item_id ? roundItems.get(it.round_item_id) : undefined;
      const { min, max } = ri ? roundItemLimits(ri) : { min: 0, max: 0 };
      if (!ri || max < 1) {
        failed.push(`${it.product_name} (${t("editPreorderUnavailable")})`);
        continue;
      }
      const optionText = [
        it.variant_name,
        ...it.selected_options.map((o) => (o.text_value ? `${o.option_name}: ${o.text_value}` : o.option_name)),
      ].filter(Boolean).join(" · ");
      addToPreorderBasket(
        { round_id: round._id, round_name: detail?.round_name ?? round.round_name, pickup_date: detail?.pickup_date ?? round.pickup_date },
        {
          round_item_id: ri._id,
          product_id: it.product_id,
          product_name_th: it.product_name,
          product_name_eng: it.product_name_eng,
          product_img: ri.product.product_img[0] ?? "",
          unit_price: it.unit_price,
          // มีตัวเลือก = ไม่รู้ราคาฐานตอนสั่ง → ไม่คิดราคาใหม่ในหน้ายืนยัน (backend คิดราคาจริงตอนสั่งเสมอ)
          base_price: it.selected_options.length || it.variant_ids.length ? undefined : ri.current_price,
          quantity: Math.min(Math.max(it.quantity, min), max),
          min_qty: min,
          max_qty: max,
          special_request: it.special_request,
          variant_ids: it.variant_ids,
          options: it.selected_options
            .filter((o) => o.option_id)
            .map((o) => ({ option_id: o.option_id as string, text_value: o.text_value })),
          option_text: optionText || null,
        },
      );
      added++;
    }
    return { added, failed };
  };

  /**
   * bill = บิลที่กดแก้ · groupId = สั่งพร้อมบิลอื่น → แก้ทุกบิลในกลุ่มที่ยังแก้ได้
   * message = ข้อความในหน้าต่างยืนยัน
   */
  const edit = async ({ bill, groupId, message }: { bill?: EditBill; groupId?: string | null; message: string }) => {
    if (busy) return;
    const ok = await confirmAlert(message, {
      title: t("editCheckout"),
      confirmText: t("editCheckoutGo"),
      cancelText: t("editCheckoutStay"),
      stacked: true,
    });
    if (!ok) return;
    setBusy(true);

    let bills: EditBill[] = bill ? [bill] : [];
    if (groupId) {
      const group = await loadGroupBills(groupId).catch(() => null);
      if (group) bills = [...bills, ...group.filter((g) => !bills.some((b) => b.doc._id === g.doc._id))];
    }
    if (bills.length === 0) {
      alert.error(t("editCheckoutFailed"));
      setBusy(false);
      return;
    }

    // ยกเลิกทีละบิล — บิลที่ยกเลิกไม่สำเร็จคงไว้ตามเดิม (ไม่ใส่สินค้ากลับ กันสั่งซ้ำ)
    const cancelled: EditBill[] = [];
    let cancelError: string | null = null;
    for (const b of bills) {
      try {
        // editCheckout = ไม่ลงข้อความ "ลูกค้ายกเลิก" ในแชทร้าน (ไม่ใช่การยกเลิกจริง — กำลังจะสั่งใหม่)
        if (b.kind === "order") await shopOrdersService.cancel(b.doc._id, t("editCheckoutReason"), { editCheckout: true });
        else await shopPreordersService.cancel(b.doc._id, t("editCheckoutReason"), { editCheckout: true });
        cancelled.push(b);
      } catch (e) {
        cancelError ??= isApiError(e) ? e.message : t("editCheckoutFailed");
      }
    }
    // แค่ทำเครื่องหมายว่าเก่า ไม่โหลดใหม่ทันที — ไม่งั้นหน้าชำระเงินที่เปิดอยู่กลายเป็นหน้าบิล "ยกเลิกแล้ว"
    //   (เหมือนหน้าประวัติ) ระหว่างใส่สินค้ากลับตะกร้า ก่อนไปหน้ายืนยันคำสั่งซื้อ · เปิดหน้าเหล่านั้นอีกครั้งค่อยโหลดใหม่
    const stale = { refetchType: "none" } as const;
    void qc.invalidateQueries({ queryKey: shopOrdersAllKey, ...stale });
    void qc.invalidateQueries({ queryKey: shopPreordersAllKey, ...stale });
    void qc.invalidateQueries({ queryKey: shopPointsKey, ...stale });
    void qc.invalidateQueries({ queryKey: shopCouponsKey, ...stale });
    void qc.invalidateQueries({ queryKey: ["catalog", "preorder-rounds"], ...stale });
    if (groupId) void qc.invalidateQueries({ queryKey: paymentGroupKey(groupId), ...stale });
    if (cancelled.length === 0) {
      alert.error(cancelError ?? t("editCheckoutFailed"));
      setBusy(false);
      return;
    }

    let added = 0;
    const failed: string[] = [];
    const orderItems = cancelled.flatMap((b) => (b.kind === "order" ? b.doc.items : []));
    if (orderItems.length) {
      const r = await addItemsToCart(orderItems);
      added += r.added;
      failed.push(...r.failed);
    }
    for (const b of cancelled) {
      if (b.kind !== "preorder") continue;
      const r = await restorePreorder(b.doc);
      added += r.added;
      failed.push(...r.failed);
    }
    setBusy(false);

    if (added === 0) {
      alert.error(t("editCheckoutNone", { failed: failed.join(" · ") }));
      router.push("/customer");
      return;
    }
    if (cancelError) alert.warning(cancelError);
    else if (failed.length) alert.warning(t("editCheckoutPartial", { n: added, failed: failed.join(" · ") }));
    router.push("/customer/checkout");
  };

  return { edit, busy };
}
