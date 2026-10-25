"use client";
// ─────────────────────────────────────────────────────────────
// บันทึก "ขอบเขตจัดส่ง" ของสินค้าจากฟอร์มเพิ่ม/แก้ไขสินค้า (ช่อง shipping_scope)
// backend ไม่รับ ships_nationwide ใน POST/PATCH สินค้า — ตั้งผ่าน PATCH /admin/shipping-zones/products (สิทธิ์ shipping.update)
// เรียกหลังบันทึกสินค้าสำเร็จ · ไม่ใช่ transaction เดียวกัน → พลาด = สินค้าบันทึกแล้วแต่ขอบเขตยังเป็นค่าเดิม (คืน false ให้แจ้งเตือน)
// ─────────────────────────────────────────────────────────────
import { useQueryClient } from "@tanstack/react-query";
import { shippingZonesService } from "@/services/shippingZones";
import { usePermission } from "@/context/PermissionsContext";
import { PRODUCT_SHIPPING_KEY } from "@/hooks/useProductShipping";
import { shippingExceptionsKey } from "@/app/customer/lib/catalogQueries";
import { scopeToValue, type ShippingScope } from "./productForm";

export function useShippingScopeSaver() {
  const qc = useQueryClient();
  const perm = usePermission("shipping");

  /** previous = ค่าก่อนแก้ (สร้างใหม่ = "category") · ไม่เปลี่ยน / ไม่มีสิทธิ์ = ไม่ยิง · คืน false = บันทึกไม่สำเร็จ */
  return async (productId: string, scope: ShippingScope | undefined, previous: ShippingScope = "category") => {
    if (!perm.update || !scope || scope === previous) return true;
    try {
      await shippingZonesService.setProductShipping([productId], scopeToValue(scope));
      void qc.invalidateQueries({ queryKey: PRODUCT_SHIPPING_KEY });
      void qc.invalidateQueries({ queryKey: shippingExceptionsKey });
      return true;
    } catch {
      return false;
    }
  };
}
