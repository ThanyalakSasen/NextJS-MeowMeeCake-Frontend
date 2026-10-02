// ─────────────────────────────────────────────────────────────
// src/services/shopLine.ts
// เชื่อม/ยกเลิกการเชื่อมบัญชี LINE ของผู้ใช้ที่ login อยู่ — /shop/me/line
// callback (/shop/me/line/callback) backend จัดการเองทั้งหมด แล้ว redirect กลับหน้าโปรไฟล์พร้อม ?line=...
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";
import type { ItemResponse } from "@/types/api";
import type { LineLinkStatus } from "@/types/lineLink";

export const shopLineService = {
  /** GET /shop/me/line — สถานะ + authorize_url ใหม่ (อายุ 10 นาที) */
  status: async (): Promise<LineLinkStatus> => {
    const res = await http.get<ItemResponse<LineLinkStatus>>("/shop/me/line");
    return res.data;
  },
  /** DELETE /shop/me/line — ยกเลิกการเชื่อม */
  unlink: async (): Promise<LineLinkStatus> => {
    const res = await http.delete<ItemResponse<LineLinkStatus>>("/shop/me/line");
    return res.data;
  },
};
