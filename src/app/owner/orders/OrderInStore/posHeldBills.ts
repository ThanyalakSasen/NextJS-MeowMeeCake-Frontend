"use client";
// ─────────────────────────────────────────────────────────────
// posHeldBills.ts — พักบิล: เก็บบิลที่ยังไม่ชำระไว้ในเครื่องที่เปิด POS (localStorage) แล้วเรียกกลับมาขายต่อ
// ไม่ส่งขึ้น backend — ยังไม่ได้สร้างออเดอร์ จึงยังไม่ตัดสต็อก/ไม่จองสิทธิ์โปร (สต็อก/โปรตรวจใหม่ตอนชำระ)
// อ่าน/เขียนครอบ try/catch เสมอ — โหมดส่วนตัว/บล็อก storage แล้วต้องใช้ POS ต่อได้ (แค่พักบิลไม่ได้)
// อ่านผ่าน useSyncExternalStore (แบบเดียวกับ preorderBasket.ts) — เปิด POS หลายแท็บก็เห็นรายการเดียวกัน
// ─────────────────────────────────────────────────────────────
import { useSyncExternalStore } from "react";
import type { PosMember } from "@/types/pos";
import type { CartLine } from "./posCart";

const STORAGE_KEY = "mmc_pos_held_bills";
const CHANGE_EVENT = "mmc-pos-held-bills-change";
/** กันเก็บสะสมไม่จบ — เกินนี้ต้องเรียกบิลเก่าออกก่อน */
export const MAX_HELD_BILLS = 20;

export interface HeldBill {
  id: string;
  /** ISO time ตอนพัก */
  heldAt: string;
  cart: CartLine[];
  member: PosMember | null;
  bahtPerPoint: number | null;
  promoIds: string[];
}

const EMPTY: HeldBill[] = [];
let cache: { raw: string | null; bills: HeldBill[] } = { raw: null, bills: EMPTY };

export function readHeldBills(): HeldBill[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  // useSyncExternalStore ต้องได้ array เดิมถ้าข้อมูลไม่เปลี่ยน (กัน render วน)
  if (raw === cache.raw) return cache.bills;
  let bills = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) bills = (parsed as HeldBill[]).filter((b) => Array.isArray(b?.cart));
  } catch {
    bills = EMPTY;
  }
  cache = { raw, bills };
  return bills;
}

/** คืน false = เขียนไม่ได้ (storage ปิด/เต็ม) */
export function saveHeldBills(bills: HeldBill[]): boolean {
  try {
    if (bills.length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return true;
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** บิลที่พักไว้ในเครื่องนี้ — ฝั่ง server = ว่าง */
export function useHeldBills(): HeldBill[] {
  return useSyncExternalStore(subscribe, readHeldBills, () => EMPTY);
}

export function newHeldBillId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const heldBillSubtotal = (b: HeldBill) => b.cart.reduce((s, c) => s + c.price * c.qty, 0);
export const heldBillItemCount = (b: HeldBill) => b.cart.reduce((s, c) => s + c.qty, 0);
