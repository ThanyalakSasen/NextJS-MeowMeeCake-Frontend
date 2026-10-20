// query ของรายการสต็อกสินค้า — ใช้ร่วมกันระหว่าง ViewModel กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
import { LIST_ALL } from "@/lib/http";

// backend ส่งเฉพาะสินค้าปกติ (ไม่ใช่พรีออเดอร์ · ไม่ถูกลบ) อยู่แล้ว
export const STOCK_PARAMS = { limit: LIST_ALL } as const;
export const STOCK_LIST_KEY = ["products", "stock-list", STOCK_PARAMS] as const;
