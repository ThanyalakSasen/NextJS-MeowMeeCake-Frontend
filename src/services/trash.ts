// ─────────────────────────────────────────────────────────────
// src/services/trash.ts — รายการที่ลบแล้ว (soft delete) + กู้คืน ของทุก resource หลังร้าน (Final-Backlog N7)
// backend ใช้รูปแบบเดียวกันทุกตัว: GET /admin/<x>?includeDeleted=true (คืนทั้งที่ใช้อยู่และที่ลบ — ไม่มีแบบ "เฉพาะที่ลบ")
// · POST /admin/<x>/:id/restore (สิทธิ์ update ของเมนูนั้น) → service เดียวพอ ไม่ต้องเพิ่ม restore ทีละไฟล์
// ดึงเฉพาะตอนเปิดหน้าต่าง "รายการที่ลบ" (RestoreDeletedButton) — กรองแถวที่มี deleted_at ฝั่งนี้
// ─────────────────────────────────────────────────────────────
import { http, LIST_ALL } from "@/lib/http";

/** แถวดิบจาก backend — แต่ละ resource ใช้ชื่อ field ต่างกัน (deletedResources.ts เลือก field ที่จะแสดง) */
export type TrashRow = Record<string, unknown> & { _id: string; deleted_at: string };

/* eslint-disable @typescript-eslint/no-explicit-any */

export const trashService = {
  /** เฉพาะรายการที่ลบแล้ว · ลบล่าสุดขึ้นก่อน */
  listDeleted: async (path: string, params: Record<string, unknown> = {}): Promise<TrashRow[]> => {
    const res = await http.getList<any>(path, { params: { limit: LIST_ALL, ...params, includeDeleted: true } });
    return res.data
      .filter((r) => r.deleted_at)
      .map((r) => ({ ...r, _id: String(r._id) }) as TrashRow)
      .sort((a, b) => b.deleted_at.localeCompare(a.deleted_at));
  },
  restore: async (path: string, id: string): Promise<void> => {
    await http.post(`${path}/${id}/restore`);
  },
};
