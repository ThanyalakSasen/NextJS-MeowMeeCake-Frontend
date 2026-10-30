"use client";
// ─────────────────────────────────────────────────────────────
// รายการพรีออเดอร์ในตะกร้า — ยกจาก FrontOffice preorder/lib/preorderCheckoutStorage.ts
// ตะกร้ารวม (2026-10-27): เก็บได้หลายรอบพร้อมกัน (1 รอบ = 1 บิลตอนสั่ง — server บังคับ 1 พรีออเดอร์ = 1 รอบ)
// สั่งพร้อมสินค้าปกติในตะกร้าที่ /customer/checkout (POST /shop/checkout) · เก็บใน localStorage (ข้ามหน้า/รีเฟรชได้)
// รูปแบบเดิม (รอบเดียว · key mmc_preorder_basket) ย้ายเข้ารูปแบบใหม่ให้เองตอนอ่านครั้งแรก
// ราคาในนี้แสดงผลเท่านั้น — server ตรวจโควตา/ขั้นต่ำ/ราคาใหม่ตอนสั่งจริงเสมอ
// ─────────────────────────────────────────────────────────────
import { useSyncExternalStore } from "react";
import { preorderSelectKey, setSelected } from "../../lib/cartSelection";

const STORAGE_KEY = "mmc_preorder_baskets";
const LEGACY_KEY = "mmc_preorder_basket";
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
  /** ราคาในรอบ (current_price ไม่รวมตัวเลือก) ตอนใส่ตะกร้า — หน้ายืนยันใช้คิดราคาใหม่เมื่อร้านแก้ราคาในรอบ
   *  (repriceBasket) · ตะกร้าเก่าที่บันทึกก่อนมีฟิลด์นี้ = ไม่มี (แสดงราคาเดิม) */
  base_price?: number;
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

/** รายการของรอบเดียว (= 1 บิลตอนสั่ง) */
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

/** เฉพาะรายการที่ติ๊กเลือกในตะกร้า · รอบที่ไม่ได้เลือกเลย = ไม่มีบิล — หน้าตะกร้ากับหน้ายืนยันต้องใช้ตัวเดียวกัน */
export const selectedBaskets = (baskets: PreorderBasket[], isSelected: (key: string) => boolean): PreorderBasket[] =>
  baskets
    .map((b) => ({ ...b, items: b.items.filter((it) => isSelected(preorderSelectKey(b.round_id, basketLineKey(it)))) }))
    .filter((b) => b.items.length > 0);

const EMPTY: PreorderBasket[] = [];
let cache: { raw: string | null; baskets: PreorderBasket[] } = { raw: null, baskets: EMPTY };

const isBasket = (b: unknown): b is PreorderBasket =>
  !!b && typeof b === "object" && !!(b as PreorderBasket).round_id && Array.isArray((b as PreorderBasket).items) && (b as PreorderBasket).items.length > 0;

/** ย้ายตะกร้ารูปแบบเดิม (รอบเดียว) มาเก็บแบบหลายรอบ — ครั้งเดียว */
function migrateLegacy(): void {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    localStorage.removeItem(LEGACY_KEY);
    if (localStorage.getItem(STORAGE_KEY)) return;
    const parsed = JSON.parse(legacy) as unknown;
    if (isBasket(parsed)) localStorage.setItem(STORAGE_KEY, JSON.stringify([parsed]));
  } catch {
    /* ข้อมูลเดิมเสีย — ทิ้งไป */
  }
}

export function readPreorderBaskets(): PreorderBasket[] {
  let raw: string | null = null;
  try {
    migrateLegacy();
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  // useSyncExternalStore ต้องได้ object เดิมถ้าข้อมูลไม่เปลี่ยน (กัน render วน)
  if (raw === cache.raw) return cache.baskets;
  let baskets: PreorderBasket[] = EMPTY;
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    baskets = Array.isArray(parsed) ? parsed.filter(isBasket) : EMPTY;
  } catch {
    baskets = EMPTY;
  }
  cache = { raw, baskets };
  return baskets;
}

function save(baskets: PreorderBasket[]): void {
  const kept = baskets.filter((b) => b.items.length > 0);
  try {
    if (kept.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
  } catch {
    /* storage ใช้ไม่ได้ (private mode ฯลฯ) */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** ล้างรอบที่ระบุ (สั่งสำเร็จแล้ว) · ไม่ระบุ = ล้างทั้งหมด */
export function clearPreorderBaskets(roundIds?: string[]): void {
  if (!roundIds) return save([]);
  const drop = new Set(roundIds);
  save(readPreorderBaskets().filter((b) => !drop.has(b.round_id)));
}

/** เพิ่มเข้ารายการของรอบนั้น (สร้างรอบใหม่ถ้ายังไม่มี) · ซ้ำ = รวมจำนวน ไม่เกิน max · เก็บได้หลายรอบพร้อมกัน */
export function addToPreorderBasket(round: Pick<PreorderBasket, "round_id" | "round_name" | "pickup_date">, item: PreorderBasketItem): void {
  const baskets = readPreorderBaskets();
  const current = baskets.find((b) => b.round_id === round.round_id);
  const base: PreorderBasket = current ? { ...current, ...round } : { ...round, items: [] };
  const key = basketLineKey(item);
  const existing = base.items.find((it) => basketLineKey(it) === key);
  const items = existing
    ? base.items.map((it) =>
        it === existing
          ? { ...it, quantity: Math.min(it.quantity + item.quantity, item.max_qty), max_qty: item.max_qty, unit_price: item.unit_price, base_price: item.base_price, special_request: item.special_request ?? it.special_request }
          : it,
      )
    : [...base.items, item];
  const next = { ...base, items };
  save(current ? baskets.map((b) => (b.round_id === round.round_id ? next : b)) : [...baskets, next]);
  // เพิ่งใส่ = ตั้งใจจะสั่ง → ติ๊กเลือกเสมอ · key ของรายการพรีออเดอร์ซ้ำได้ (รอบ+สินค้า+ตัวเลือกเดิม) ถ้าเคยติ๊กออก
  // แล้วลบทิ้ง ใส่ใหม่จะค้างเป็น "ไม่เลือก" → หน้าตะกร้าปิดปุ่มสั่งซื้อ / หน้ายืนยันขึ้นว่าตะกร้าว่าง
  setSelected([preorderSelectKey(round.round_id, key)], true);
}

function patchRound(roundId: string, fn: (items: PreorderBasketItem[]) => PreorderBasketItem[]): void {
  save(readPreorderBaskets().map((b) => (b.round_id === roundId ? { ...b, items: fn(b.items) } : b)));
}

/** เอารายการที่สั่งแล้วออก (สั่งบางรายการ — ที่ไม่ได้เลือกยังอยู่ในตะกร้า) */
export function removePreorderLines(lines: { roundId: string; keys: string[] }[]): void {
  const drop = new Map(lines.map((l) => [l.roundId, new Set(l.keys)]));
  save(readPreorderBaskets().map((b) => (drop.has(b.round_id) ? { ...b, items: b.items.filter((it) => !drop.get(b.round_id)!.has(basketLineKey(it))) } : b)));
}

/**
 * ราคาปัจจุบันของรอบ — unit_price เก็บไว้ตอนใส่ตะกร้า แต่ตอนสั่ง backend คิดราคาของรอบ ณ ตอนนั้น (ร้านแก้ราคาในรอบได้)
 * → ราคาใหม่ = current_price ล่าสุด + ส่วนของตัวเลือก (unit_price − base_price) · ไม่มี base_price / สินค้าไม่อยู่ในรอบแล้ว = ราคาเดิม
 */
export function repriceBasket(b: PreorderBasket, roundItems: { _id: string; current_price: number }[] | undefined): PreorderBasket {
  if (!roundItems) return b;
  const priceOf = new Map(roundItems.map((ri) => [ri._id, ri.current_price]));
  return {
    ...b,
    items: b.items.map((it) => {
      const current = priceOf.get(it.round_item_id);
      if (current == null || it.base_price == null || current === it.base_price) return it;
      return { ...it, unit_price: Math.round((current + it.unit_price - it.base_price) * 100) / 100, base_price: current };
    }),
  };
}

export function updatePreorderBasketItem(roundId: string, key: string, patch: Partial<Pick<PreorderBasketItem, "quantity" | "special_request">>): void {
  patchRound(roundId, (items) => items.map((it) => (basketLineKey(it) === key ? { ...it, ...patch } : it)));
}

export function removePreorderBasketItem(roundId: string, key: string): void {
  patchRound(roundId, (items) => items.filter((it) => basketLineKey(it) !== key));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange); // แท็บอื่น
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** รายการพรีออเดอร์ทุกรอบ (อัปเดตอัตโนมัติเมื่อเปลี่ยน · ฝั่ง server = []) */
export function usePreorderBaskets(): PreorderBasket[] {
  return useSyncExternalStore(subscribe, readPreorderBaskets, () => EMPTY);
}

/** จำนวนรายการ (บรรทัด) ทุกรอบรวมกัน — ป้ายตัวเลขตะกร้า */
export const preorderLineCount = (baskets: PreorderBasket[]) => baskets.reduce((s, b) => s + b.items.length, 0);
