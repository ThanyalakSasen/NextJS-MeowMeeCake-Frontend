"use client";
// ─────────────────────────────────────────────────────────────
// useBuyAgain — "ซื้ออีกครั้ง" ในประวัติ/รายละเอียดออเดอร์ (BACKLOG4 U7 · FrontOffice ไม่มี)
// ใส่ทุกรายการของออเดอร์ลงตะกร้าตามตัวเลือก/ออปชันเดิม (POST /shop/cart/items ทีละรายการ) → ไปหน้าตะกร้า
// ราคา/สต็อกเป็นของปัจจุบัน (backend คิดใหม่) · รายการที่ใส่ไม่ได้ (ปิดขาย · ตัวเลือกถูกลบ · ฯลฯ) แจ้งชื่อ + เหตุผลจาก backend
// สต็อกไม่พอไม่ตัดสินที่นี่ — หน้าตะกร้าแสดงป้าย "ซื้อไม่ได้" ต่อบรรทัดอยู่แล้ว (U6)
// opts.redirect = ไปหน้าอื่นแทนตะกร้า (เช่น กลับไปแก้ที่อยู่/วิธีรับ = /customer/checkout) · opts.quiet = ไม่แจ้ง "ใส่ตะกร้าแล้ว"
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { shopCartService } from "@/services/shopCart";
import type { ShopOrderItem } from "@/services/shopOrders";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { useCartCountStore } from "../store/cartCountStore";
import { shopCartKey } from "../lib/shopQueries";
import { setSelected } from "../lib/cartSelection";

export function useBuyAgain() {
  const t = useTranslations("shop.cartActions");
  const [pending, setPending] = useState(false);
  const setCount = useCartCountStore((s) => s.setCount);
  const router = useRouter();
  const qc = useQueryClient();

  /** คืน true = ใส่ตะกร้าได้อย่างน้อย 1 รายการ (และไปหน้าถัดไปแล้ว) */
  const buyAgain = async (items: ShopOrderItem[], opts: { redirect?: string; quiet?: boolean } = {}): Promise<boolean> => {
    if (pending || items.length === 0) return false;
    setPending(true);
    const failed: string[] = [];
    let added = 0;
    for (const it of items) {
      const options = it.selected_options
        .filter((o) => o.option_id)
        .map((o) => ({ option_id: o.option_id as string, ...(o.text_value ? { text_value: o.text_value } : {}) }));
      try {
        const res = await shopCartService.addItem({
          product_id: it.product_id,
          quantity: it.quantity,
          ...(it.variant_ids.length ? { variant_ids: it.variant_ids } : {}),
          ...(options.length ? { selected_options: options } : {}),
        });
        // รวมเข้าบรรทัดเดิมที่เคยติ๊กออก = ติ๊กกลับ (เหมือน useAddToCart)
        if (res.data?._id) setSelected([res.data._id], true);
        added++;
      } catch (e) {
        // ข้อความของ backend มักมีชื่อสินค้าอยู่แล้ว (เช่น ตัวเลือกถูกลบ) — ไม่ต่อชื่อซ้ำ
        const name = it.product_name || t("product");
        const msg = isApiError(e) ? e.message : "";
        failed.push(!msg ? name : msg.includes(name) ? msg : `${name} (${msg})`);
      }
    }
    // ใส่ตะกร้าล่าสุดลง cache ก่อนเปลี่ยนหน้า — ไม่งั้นหน้าที่ไปถึง (ตะกร้า/ยืนยันคำสั่งซื้อ) เห็นตะกร้าเก่าที่ยังว่างแวบหนึ่ง
    const cart = await shopCartService.get().catch(() => null);
    if (cart) {
      qc.setQueryData(shopCartKey, cart);
      setCount(cart.summary?.item_count ?? cart.items.length);
    } else {
      await qc.invalidateQueries({ queryKey: shopCartKey });
    }
    setPending(false);

    if (added === 0) {
      alert.error(t("buyAgainNone", { failed: failed.join(" · ") }));
      return false;
    }
    if (failed.length) alert.warning(t("buyAgainPartial", { n: added, failed: failed.join(" · ") }));
    else if (!opts.quiet) alert.success(t("buyAgainDone", { n: added }));
    router.push(opts.redirect ?? "/customer/cart");
    return true;
  };

  return { buyAgain, pending };
}
