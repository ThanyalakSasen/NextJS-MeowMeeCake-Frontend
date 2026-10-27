"use client";
// ─────────────────────────────────────────────────────────────
// เลือกว่าจะสั่งรายการไหนในตะกร้า (ตะกร้ารวม — ติ๊กเลือกรายสินค้า / ทั้งบิล · 2026-10-27)
// เก็บ "รายการที่ไม่เลือก" ใน localStorage — ของที่เพิ่งใส่ตะกร้าจึงถูกเลือกไว้เสมอ · ใช้ร่วมกันหน้าตะกร้า ↔ หน้ายืนยัน
//   สินค้าปกติ: id ของรายการในตะกร้า (cart item _id) · พรีออเดอร์: `${round_id}|${basketLineKey}`
// สั่งเสร็จแล้วรายการที่สั่งออกจากตะกร้า (backend / preorderBasket) — key ที่ค้างไม่มีผล (ไม่ตรงกับรายการไหน)
// ─────────────────────────────────────────────────────────────
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "mmc_cart_unselected";
const CHANGE_EVENT = "mmc-cart-selection-change";
const MAX_KEYS = 500;

const EMPTY: readonly string[] = [];
let cache: { raw: string | null; keys: readonly string[] } = { raw: null, keys: EMPTY };

export const preorderSelectKey = (roundId: string, lineKey: string) => `${roundId}|${lineKey}`;

function read(): readonly string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.keys;
  let keys: readonly string[] = EMPTY;
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    keys = Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === "string") : EMPTY;
  } catch {
    keys = EMPTY;
  }
  cache = { raw, keys };
  return keys;
}

function save(keys: string[]): void {
  try {
    if (keys.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(keys.slice(-MAX_KEYS)));
  } catch {
    /* storage ใช้ไม่ได้ — เลือกทั้งหมดเสมอ */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** ตั้งเลือก/ไม่เลือกหลายรายการพร้อมกัน (ติ๊กทั้งบิล) */
export function setSelected(keys: string[], selected: boolean): void {
  const current = new Set(read());
  for (const k of keys) {
    if (selected) current.delete(k);
    else current.add(k);
  }
  save([...current]);
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** isSelected(key) — ค่าเริ่มต้น = เลือก (ฝั่ง server = เลือกทั้งหมด) */
export function useCartSelection() {
  const unselected = useSyncExternalStore(subscribe, read, () => EMPTY);
  const off = new Set(unselected);
  return {
    isSelected: (key: string) => !off.has(key),
    toggle: (key: string) => setSelected([key], off.has(key)),
    setSelected,
  };
}
