// ─────────────────────────────────────────────────────────────
// bannersQuery.ts — pure: query key/params ของหน้าจัดการแบนเนอร์
// ใช้ร่วมกันระหว่าง ViewModel (browser) กับ page.tsx (server prefetch) · ไม่มี "use client" — server เรียกได้
// ─────────────────────────────────────────────────────────────
import { LIST_ALL } from "@/lib/http";

export const BANNERS_PARAMS = { limit: LIST_ALL, sort: "sort_order" };
export const BANNERS_KEY = ["banners"] as const;
