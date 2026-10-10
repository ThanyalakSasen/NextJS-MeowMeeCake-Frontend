"use client";
// ─────────────────────────────────────────────────────────────
// รายการพรีออเดอร์ (ตะกร้าพรีออเดอร์) — ยกจาก FrontOffice preorder/lib/preorderCheckoutStorage.ts
// หน้าสินค้า (โหมดพรีออเดอร์) → เพิ่มลงรายการ → /customer/preorder/checkout · แยกจากตะกร้าปกติ (backend ไม่มีตะกร้าพรีออเดอร์)
// ได้หลายสินค้าแต่ต้อง "รอบเดียวกัน" (1 พรีออเดอร์ = 1 รอบ — server บังคับ) · เก็บใน localStorage (ข้ามหน้า/รีเฟรชได้)
// ราคาในนี้แสดงผลเท่านั้น — server ตรวจโควตา/ขั้นต่ำ/ราคาใหม่ตอนสั่งจริงเสมอ
// ─────────────────────────────────────────────────────────────
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "mmc_preorder_basket";
const CHANGE_EVENT = "mmc-preorder-basket-change";

export interface PreorderBasketItem {
  round_item_id: string;
  product_id: string;
  product_name_th: string;
  /** ชื่ออังกฤษ (แสดงตอนเลือกภาษาอังกฤษ) — ตะกร้าเก่าที่บันทึกก่อนมีฟิลด์นี้ = ไม่มี */
  product_name_eng?: string | null;
  product_img: string;
  /** ราคาต่อชิ้นรวมตัวเลือก (แสดงผล) */
  unit_price: number;
  quantity: number;
  min_qty: number;
  /** สูงสุดที่สั่งได้ ณ ตอนเพิ่ม (โควตาเหลือ / ต่อคน) — server ตรวจซ้ำ */
  max_qty: number;
  special_request: string | null;
  variant_ids: string[];
  options: { option_id: string; text_value: string | null }[];
  /** ข้อความตัวเลือกไว้แสดง ("ขนาด: 2 ปอนด์ · ข้อความบนเค้ก: HBD") */
  option_text: string | null;
}

export interface PreorderBasket {
  round_id: string;
  round_name: string;
  /** วันรับวันแรกของรอบ (ISO) */
  pickup_date: string;
  items: PreorderBasketItem[];
}

/** รายการเดียวกัน = สินค้าในรอบเดียวกัน + ชุดตัวเลือกเดียวกัน → รวมจำนวน (backend รวมแถวซ้ำแบบเดียวกัน) */
export const basketLineKey = (it: Pick<PreorderBasketItem, "round_item_id" | "variant_ids" | "options">) =>
  JSON.stringify([it.round_item_id, [...it.variant_ids].sort(), it.options]);

let cache: { raw: string | null; basket: PreorderBasket | null } = { raw: null, basket: null };

export function readPreorderBasket(): PreorderBasket | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  // useSyncExternalStore ต้องได้ object เดิมถ้าข้อมูลไม่เปลี่ยน (กัน render วน)
  if (raw === cache.raw) return cache.basket;
  let basket: PreorderBasket | null = null;
  try {
    const parsed = raw ? (JSON.parse(raw) as PreorderBasket) : null;
    basket = parsed?.round_id && Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed : null;
  } catch {
    basket = null;
  }
  cache = { raw, basket };
  return basket;
}

export function savePreorderBasket(basket: PreorderBasket | null): void {
  try {
    if (!basket || basket.items.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(basket));
  } catch {
    /* storage ใช้ไม่ได้ (private mode ฯลฯ) */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const clearPreorderBasket = () => savePreorderBasket(null);

/**
 * เพิ่มเข้ารายการ — ว่าง/รอบเดียวกัน = เพิ่ม (ซ้ำรวมจำนวน ไม่เกิน max) · มีของรอบอื่นค้าง = คืน conflict ให้ถามลูกค้าก่อน
 * (replace: true = ล้างรอบเดิมแล้วเริ่มรอบนี้)
 */
export function addToPreorderBasket(
  round: Pick<PreorderBasket, "round_id" | "round_name" | "pickup_date">,
  item: PreorderBasketItem,
  opts: { replace?: boolean } = {},
): { ok: true } | { ok: false; conflictRoundName: string } {
  const current = readPreorderBasket();
  if (current && current.round_id !== round.round_id && !opts.replace) return { ok: false, conflictRoundName: current.round_name };
  const base: PreorderBasket = current && current.round_id === round.round_id ? current : { ...round, items: [] };
  const key = basketLineKey(item);
  const existing = base.items.find((it) => basketLineKey(it) === key);
  const items = existing
    ? base.items.map((it) =>
        it === existing
          ? { ...it, quantity: Math.min(it.quantity + item.quantity, item.max_qty), max_qty: item.max_qty, unit_price: item.unit_price, special_request: item.special_request ?? it.special_request }
          : it,
      )
    : [...base.items, item];
  savePreorderBasket({ ...base, items });
  return { ok: true };
}

export function updatePreorderBasketItem(key: string, patch: Partial<Pick<PreorderBasketItem, "quantity" | "special_request">>): void {
  const current = readPreorderBasket();
  if (!current) return;
  savePreorderBasket({ ...current, items: current.items.map((it) => (basketLineKey(it) === key ? { ...it, ...patch } : it)) });
}

export function removePreorderBasketItem(key: string): void {
  const current = readPreorderBasket();
  if (!current) return;
  savePreorderBasket({ ...current, items: current.items.filter((it) => basketLineKey(it) !== key) });
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange); // แท็บอื่น
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** รายการพรีออเดอร์ปัจจุบัน (อัปเดตอัตโนมัติเมื่อเปลี่ยน · ฝั่ง server = null) */
export function usePreorderBasket(): PreorderBasket | null {
  return useSyncExternalStore(subscribe, readPreorderBasket, () => null);
}
