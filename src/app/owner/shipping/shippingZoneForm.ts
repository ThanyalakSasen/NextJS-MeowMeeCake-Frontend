// ─────────────────────────────────────────────────────────────
// ฟอร์ม + กติกาโซนค่าส่งเว็บ (BACKLOG4 F2) — สำเนากติกา backend schemas/shipping.ts + shippingService.updateShippingZone
//   - จังหวัดต้องเป็นชื่อทางการใน 77 จังหวัด (หน้าเว็บให้เลือกจากรายการเท่านั้น)
//   - จังหวัดหนึ่งอยู่ได้โซนเดียว · โซน D = จังหวัดที่เหลือทั้งหมด (ใส่จังหวัดไม่ได้)
//   - ค่าส่งคิดตามจังหวัดในที่อยู่ลูกค้า: ตรงกับ A/B/C → โซนนั้น · ไม่ตรง = โซน D (backend lib/shipping.ts computeShippingFee)
// ─────────────────────────────────────────────────────────────
import type { ShippingZone, ShippingZoneCode, ShippingZoneUpdate } from "@/types/shippingZone";

export interface ShippingZoneForm {
  zone_label: string;
  fee: number;
  provinces: string[];
}

export type ShippingZoneErrorKey = "labelRequired" | "labelTooLong" | "feeInvalid";
export type ShippingZoneErrors = Partial<Record<"zone_label" | "fee", ShippingZoneErrorKey>>;

/** โซนที่เหลือทั้งหมด — ไม่มีรายชื่อจังหวัด */
export const FALLBACK_ZONE: ShippingZoneCode = "D";

export const toShippingZoneForm = (z: ShippingZone): ShippingZoneForm => ({
  zone_label: z.zone_label,
  fee: z.fee,
  provinces: [...z.provinces],
});

export function validateShippingZone(f: ShippingZoneForm): ShippingZoneErrors {
  const e: ShippingZoneErrors = {};
  const label = f.zone_label.trim();
  if (!label) e.zone_label = "labelRequired";
  else if (label.length > 120) e.zone_label = "labelTooLong";
  if (!Number.isFinite(f.fee) || f.fee < 0 || Math.round(f.fee * 100) !== f.fee * 100) e.fee = "feeInvalid";
  return e;
}

/** body ของ PATCH — โซน D ไม่ส่ง provinces · ตัดชื่อซ้ำ */
export const toShippingZoneUpdate = (code: ShippingZoneCode, f: ShippingZoneForm): ShippingZoneUpdate => ({
  zone_label: f.zone_label.trim(),
  fee: f.fee,
  ...(code === FALLBACK_ZONE ? {} : { provinces: [...new Set(f.provinces)] }),
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
  return (
    (p && zones.find((z) => z.zone_code !== FALLBACK_ZONE && z.provinces.some((x) => x.trim() === p))) ||
    zones.find((z) => z.zone_code === FALLBACK_ZONE) ||
    null
  );
}
