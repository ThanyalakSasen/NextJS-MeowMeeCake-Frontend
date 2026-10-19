// ─────────────────────────────────────────────────────────────
// couponsQuery.ts — pure: query key/params ของหน้าคูปอง/ส่วนลด
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
import { LIST_ALL } from "@/lib/http";

export const COUPONS_PARAMS = { limit: LIST_ALL };
export const COUPONS_KEY = ["promotions"] as const;
