// ─────────────────────────────────────────────────────────────
// ฟอร์ม + กติกาโซนค่าส่งเว็บ (BACKLOG4 F2) — สำเนากติกา backend schemas/shipping.ts + shippingService.updateShippingZone
//   - จังหวัดต้องเป็นชื่อทางการใน 77 จังหวัด (หน้าเว็บให้เลือกจากรายการเท่านั้น)
//   - จังหวัดหนึ่งอยู่ได้โซนเดียว · โซนจังหวัดอื่นทั้งหมด (is_fallback · ตัวอักษรสุดท้ายเสมอ) = จังหวัดที่เหลือ (ใส่จังหวัดไม่ได้ · ลบไม่ได้)
//   - ค่าส่งคิดตามจังหวัดในที่อยู่ลูกค้า: ตรงกับโซนไหน → โซนนั้น · ไม่ตรง = โซนจังหวัดอื่นทั้งหมด (backend lib/shipping.ts zoneForProvince)
//   - เพิ่มโซนใหม่ได้ (2026-10-26) — ต้องเลือกจังหวัดอย่างน้อย 1 · รหัสโซน backend ตั้งให้
// ─────────────────────────────────────────────────────────────
import type { ShippingZone, ShippingZoneCode, ShippingZoneCreate, ShippingZoneUpdate } from "@/types/shippingZone";

export interface ShippingZoneForm {
  zone_label: string;
  fee: number;
  provinces: string[];
}

export type ShippingZoneErrorKey = "labelRequired" | "labelTooLong" | "feeInvalid" | "provincesRequired";
export type ShippingZoneErrors = Partial<Record<"zone_label" | "fee" | "provinces", ShippingZoneErrorKey>>;

/** โซนจังหวัดอื่นทั้งหมด — backend ตั้ง is_fallback ให้ · ไม่มี flag (ข้อมูลเก่า) = โซนท้ายรายการ */
export const fallbackZoneOf = (zones: ShippingZone[]): ShippingZone | null =>
  zones.find((z) => z.is_fallback) ?? zones[zones.length - 1] ?? null;

export const EMPTY_SHIPPING_ZONE_FORM: ShippingZoneForm = { zone_label: "", fee: 0, provinces: [] };

export const toShippingZoneForm = (z: ShippingZone): ShippingZoneForm => ({
  zone_label: z.zone_label,
  fee: z.fee,
  provinces: [...z.provinces],
});

/** ทศนิยมไม่เกิน 2 ตำแหน่ง — เทียบแบบเผื่อค่าคลาดของทศนิยม (1.1 * 100 = 110.00000000000001 เดิมจึงถูกตีว่าไม่ถูกต้อง) */
export const isWholeSatang = (n: number) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;

/** isNew = เพิ่มโซนใหม่ — ต้องมีจังหวัดอย่างน้อย 1 (โซนที่ไม่มีจังหวัดไม่มีผลอะไร) */
export function validateShippingZone(f: ShippingZoneForm, isNew = false): ShippingZoneErrors {
  const e: ShippingZoneErrors = {};
  const label = f.zone_label.trim();
  if (!label) e.zone_label = "labelRequired";
  else if (label.length > 120) e.zone_label = "labelTooLong";
  if (!Number.isFinite(f.fee) || f.fee < 0 || !isWholeSatang(f.fee)) e.fee = "feeInvalid";
  if (isNew && f.provinces.length === 0) e.provinces = "provincesRequired";
  return e;
}

/** body ของ PATCH — โซนจังหวัดอื่นทั้งหมดไม่ส่ง provinces · ตัดชื่อซ้ำ */
export const toShippingZoneUpdate = (isFallback: boolean, f: ShippingZoneForm): ShippingZoneUpdate => ({
  zone_label: f.zone_label.trim(),
  fee: f.fee,
  ...(isFallback ? {} : { provinces: [...new Set(f.provinces)] }),
});

export const toShippingZoneCreate = (f: ShippingZoneForm): ShippingZoneCreate => ({
  zone_label: f.zone_label.trim(),
  fee: f.fee,
  provinces: [...new Set(f.provinces)],
});

/** จังหวัด → รหัสโซนที่ใช้อยู่ (ไม่นับโซนที่กำลังแก้) — ใช้ปิดตัวเลือกที่อยู่โซนอื่นแล้ว */
export function provinceOwners(zones: ShippingZone[], except: ShippingZoneCode | null): Map<string, ShippingZoneCode> {
  const owners = new Map<string, ShippingZoneCode>();
  for (const z of zones) if (z.zone_code !== except) for (const p of z.provinces) owners.set(p.trim(), z.zone_code);
  return owners;
}

/** จังหวัดนี้คิดค่าส่งโซนไหน (เหมือน backend computeShippingFee) */
export function resolveShippingZone(province: string, zones: ShippingZone[]): ShippingZone | null {
  const p = province.trim();
  const fallback = fallbackZoneOf(zones);
  return (p && zones.find((z) => z !== fallback && z.provinces.some((x) => x.trim() === p))) || fallback;
}
