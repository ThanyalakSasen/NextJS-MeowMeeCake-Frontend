"use client";
// ─────────────────────────────────────────────────────────────
// useAddToCart — เพิ่มสินค้าลงตะกร้า (POST /shop/cart/items) · ย้ายมาจาก FrontOffice (customer/hooks/useAddToCart.ts)
// เปลี่ยนจากเดิม: session = useCustomerSession · endpoint = /shop/cart/items ของ backend หลัก
// ตัดออก: addBundleToCart (แพ็กเกจ/เซ็ตขนม — ร้านเลิกใช้ H1)
// ตัวเลือกสินค้า (C1): ส่ง variant_ids + selected_options ผ่านพารามิเตอร์ที่ 3
// ผลลัพธ์ทุกกรณีแจ้งผ่าน alert กลางที่นี่ที่เดียว · status ไว้ทำ animation ของปุ่ม
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { shopCartService, type CartCustomization } from "@/services/shopCart";
import { catalogService } from "@/services/catalog";
import { hasCustomization } from "@/lib/customizationSelection";
import { productCustomizationKey } from "../lib/catalogQueries";
import { alert } from "@/lib/alert";
import { isApiError } from "@/types/api";
import { LOGIN_PATH } from "@/constants/auth";
import { useCartCountStore } from "../store/cartCountStore";

type AddStatus = "idle" | "loading" | "success" | "error";

export function useAddToCart() {
  const [status, setStatus] = useState<AddStatus>("idle");
  const { status: authStatus } = useCustomerSession();
  const increment = useCartCountStore((s) => s.increment);
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();

  const addToCart = async (productId: string, qty: number = 1, customization: CartCustomization = {}) => {
    if (status === "loading") return false;

    if (authStatus !== "authenticated") {
      setStatus("error");
      alert.warning("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า");
      router.push(`${LOGIN_PATH}?next=${encodeURIComponent(pathname)}`);
      setTimeout(() => setStatus("idle"), 2500);
      return false;
    }

    setStatus("loading");
    try {
      await shopCartService.addItem({ product_id: productId, quantity: qty, ...customization });
      increment();
      setStatus("success");
      alert.success("เพิ่มสินค้าลงตะกร้าแล้ว");
      setTimeout(() => setStatus("idle"), 1500);
      return true;
    } catch (err) {
      setStatus("error");
      alert.error(isApiError(err) ? err.message : "เพิ่มสินค้าไม่สำเร็จ");
      setTimeout(() => setStatus("idle"), 2500);
      return false;
    }
  };

  /**
   * ปุ่มเพิ่มลงตะกร้าที่ไม่มีหน้าต่างเลือกตัวเลือก (บัตรสินค้า · รายการโปรด) — สินค้ามีกลุ่มตัวเลือก/ออปชัน
   * → พาไปหน้าสินค้าให้เลือกก่อน (ไม่งั้นกลุ่มบังคับเลือกได้ 400) · customization cache ร่วมกับหน้าสินค้า
   * (รายการสินค้าของ backend ไม่บอกว่าสินค้าไหนมีตัวเลือก — Q-BE9)
   */
  const quickAdd = async (productId: string) => {
    if (authStatus === "authenticated" && status !== "loading") {
      setStatus("loading");
      const custom = await qc
        .fetchQuery({ queryKey: productCustomizationKey(productId), queryFn: () => catalogService.customization(productId), staleTime: 5 * 60_000 })
        .catch(() => null);
      setStatus("idle");
      if (hasCustomization(custom)) {
        alert.info("สินค้านี้มีตัวเลือก — เลือกตัวเลือกก่อนเพิ่มลงตะกร้า");
        router.push(`/customer/product/${productId}`);
        return false;
      }
    }
    return addToCart(productId, 1);
  };

  return { addToCart, quickAdd, status };
}
