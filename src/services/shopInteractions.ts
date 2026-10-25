// ─────────────────────────────────────────────────────────────
// src/services/shopInteractions.ts — บันทึกพฤติกรรมให้ระบบแนะนำสินค้า (/shop/interactions · ต้อง login)
// ส่งได้แค่ "view" — add_to_cart backend บันทึกเองตอนใส่ตะกร้า · wishlist = /shop/favorites · purchase = จากออเดอร์
// backend ไม่นับซ้ำถ้าดูสินค้าเดิมภายใน 30 นาที → เรียกซ้ำได้ (เช่น StrictMode / refresh)
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";

export const shopInteractionsService = {
  /** POST /shop/interactions — ลูกค้าเปิดดูสินค้า · ไม่โยน error (ไม่ใช่งานหลักของหน้า) */
  trackView: async (productId: string): Promise<void> => {
    try {
      await http.post("/shop/interactions", { product_id: productId, action_type: "view" }, { skipAuthRedirect: true });
    } catch {
      // บันทึกไม่ได้ไม่กระทบการดูสินค้า
    }
  },
};
