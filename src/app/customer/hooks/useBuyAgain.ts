"use client";
// ─────────────────────────────────────────────────────────────
// useBuyAgain — "ซื้ออีกครั้ง" ในประวัติ/รายละเอียดออเดอร์ (BACKLOG4 U7 · FrontOffice ไม่มี)
// ใส่ทุกรายการของออเดอร์ลงตะกร้าตามตัวเลือก/ออปชันเดิม (POST /shop/cart/items ทีละรายการ) → ไปหน้าตะกร้า
// ราคา/สต็อกเป็นของปัจจุบัน (backend คิดใหม่) · รายการที่ใส่ไม่ได้ (ปิดขาย · ตัวเลือกถูกลบ · ฯลฯ) แจ้งชื่อ + เหตุผลจาก backend
// สต็อกไม่พอไม่ตัดสินที่นี่ — หน้าตะกร้าแสดงป้าย "ซื้อไม่ได้" ต่อบรรทัดอยู่แล้ว (U6)
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { shopCartService } from "@/services/shopCart";
import type { ShopOrderItem } from "@/services/shopOrders";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { useCartCountStore } from "../store/cartCountStore";
import { shopCartKey } from "../lib/shopQueries";

export function useBuyAgain() {
  const [pending, setPending] = useState(false);
  const setCount = useCartCountStore((s) => s.setCount);
  const router = useRouter();
  const qc = useQueryClient();

  const buyAgain = async (items: ShopOrderItem[]) => {
    if (pending || items.length === 0) return;
    setPending(true);
    const failed: string[] = [];
    let added = 0;
    for (const it of items) {
      const options = it.selected_options
        .filter((o) => o.option_id)
        .map((o) => ({ option_id: o.option_id as string, ...(o.text_value ? { text_value: o.text_value } : {}) }));
      try {
        await shopCartService.addItem({
          product_id: it.product_id,
          quantity: it.quantity,
          ...(it.variant_ids.length ? { variant_ids: it.variant_ids } : {}),
          ...(options.length ? { selected_options: options } : {}),
        });
        added++;
      } catch (e) {
        // ข้อความของ backend มักมีชื่อสินค้าอยู่แล้ว (เช่น ตัวเลือกถูกลบ) — ไม่ต่อชื่อซ้ำ
        const name = it.product_name || "สินค้า";
        const msg = isApiError(e) ? e.message : "";
        failed.push(!msg ? name : msg.includes(name) ? msg : `${name} (${msg})`);
      }
    }
    await qc.invalidateQueries({ queryKey: shopCartKey });
    const cart = await shopCartService.get().catch(() => null);
    if (cart) setCount(cart.summary?.item_count ?? cart.items.length);
    setPending(false);

    if (added === 0) {
      alert.error(`ใส่สินค้าลงตะกร้าไม่ได้: ${failed.join(" · ")}`);
      return;
    }
    if (failed.length) alert.warning(`ใส่ลงตะกร้าแล้ว ${added} รายการ · ใส่ไม่ได้: ${failed.join(" · ")}`);
    else alert.success(`ใส่สินค้าลงตะกร้าแล้ว ${added} รายการ`);
    router.push("/customer/cart");
  };

  return { buyAgain, pending };
}
