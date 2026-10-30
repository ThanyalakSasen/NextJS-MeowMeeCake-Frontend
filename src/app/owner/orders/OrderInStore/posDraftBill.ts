"use client";
// ─────────────────────────────────────────────────────────────
// posDraftBill.ts — บิลที่กำลังขายค้างไว้ในเครื่องอัตโนมัติ (localStorage)
// เดิมบิลอยู่แค่ใน state ของหน้า POS — สแกนแล้วกดไปหน้าอื่น/รีเฟรช = บิลหายหมด (ต้องกด "พักบิล" เองก่อน)
// เขียนทุกครั้งที่บิลเปลี่ยน · เปิดหน้า POS กลับมาโหลดคืน · บิลว่าง (ชำระแล้ว/ล้าง/พัก) = ลบทิ้ง
// เก็บออเดอร์ที่สร้างแล้วแต่ค้างรับเงินด้วย — กลับมากดชำระใช้ใบเดิม ไม่สร้างใบซ้ำ (ใบนั้นตัดสต็อกไปแล้ว)
// ยังไม่ได้สร้างออเดอร์ = ยังไม่ตัดสต็อก/ไม่จองโปร (สต็อก/ราคา/โปรตรวจใหม่ตอนชำระ เหมือนบิลที่พักไว้)
// อ่าน/เขียนครอบ try/catch เสมอ — storage ปิด/เต็ม POS ต้องใช้ต่อได้ (แค่บิลไม่ค้าง)
// ─────────────────────────────────────────────────────────────
import type { Order } from "@/types/order";
import type { PosMember } from "@/types/pos";
import type { CartLine } from "./posCart";

const STORAGE_KEY = "mmc_pos_draft_bill";

export interface DraftBill {
  cart: CartLine[];
  member: PosMember | null;
  bahtPerPoint: number | null;
  promoIds: string[];
  /** ออเดอร์ที่สร้างแล้วแต่รับเงินไม่สำเร็จ (usePOSViewModel pendingOrderRef) */
  pendingOrder: { order: Order; signature: string } | null;
}

export function readDraftBill(): DraftBill | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<DraftBill> | null;
    if (!d || !Array.isArray(d.cart)) return null;
    return {
      cart: d.cart,
      member: d.member ?? null,
      bahtPerPoint: d.bahtPerPoint ?? null,
      promoIds: Array.isArray(d.promoIds) ? d.promoIds : [],
      pendingOrder: d.pendingOrder ?? null,
    };
  } catch {
    return null;
  }
}

/** บิลว่างและไม่มีออเดอร์ค้าง = ลบทิ้ง */
export function saveDraftBill(d: DraftBill): void {
  try {
    if (d.cart.length === 0 && !d.pendingOrder) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    // storage ปิด/เต็ม — บิลไม่ค้าง แต่ขายต่อได้ปกติ
  }
}
