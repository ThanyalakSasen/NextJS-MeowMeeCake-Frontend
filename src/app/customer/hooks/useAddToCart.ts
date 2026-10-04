"use client";
// ─────────────────────────────────────────────────────────────
// useAddToCart — เพิ่มสินค้าลงตะกร้า (POST /shop/cart/items) · ย้ายมาจาก FrontOffice (customer/hooks/useAddToCart.ts)
// เปลี่ยนจากเดิม: session = useCustomerSession · endpoint = /shop/cart/items ของ backend หลัก
// ตัดออก: addBundleToCart (แพ็กเกจ/เซ็ตขนม — backend ยังไม่รองรับ) · ตัวเลือกสินค้า variant_ids หลายตัว
// (backend รับ variant_id เดียว — ยังไม่มีสินค้ามีตัวเลือก BACKLOG2 §6)
// ผลลัพธ์ทุกกรณีแจ้งผ่าน alert กลางที่นี่ที่เดียว · status ไว้ทำ animation ของปุ่ม
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { shopCartService } from "@/services/shopCart";
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

  const addToCart = async (productId: string, qty: number = 1) => {
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
      await shopCartService.addItem({ product_id: productId, quantity: qty });
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

  return { addToCart, status };
}
