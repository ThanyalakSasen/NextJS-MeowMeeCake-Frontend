// ─────────────────────────────────────────────────────────────
// ฟอร์ม + กติกาโซนค่าจัดส่ง (BACKLOG4 I8) — สำเนากติกา backend deliveryService.calcDeliveryFee / schemas/delivery
//   - จังหวัดจากที่อยู่ตัด "จังหวัด"/"จ." ข้างหน้า แล้วต้องตรงตัวกับชื่อในโซน
//   - โซนที่เปิดใช้เรียงตาม sort_order · โซนเฉพาะจังหวัดที่ตรงก่อน → ไม่ตรงเลย = โซน catch-all
//   - ไม่มีโซนเปิดใช้ / ไม่ตรงโซนไหนและไม่มี catch-all = ค่าตั้งต้นจาก env ของ backend
// ─────────────────────────────────────────────────────────────
import type { DeliveryZone, DeliveryZoneInput } from "@/types/deliveryZone";

export const EMPTY_ZONE_FORM: DeliveryZoneInput = {
  zone_name: "",
  provinces: [],
  is_catch_all: false,
  fee: 0,
  sort_order: 0,
  is_active: true,
};

export type ZoneErrorKey = "nameRequired" | "nameTooLong" | "feeInvalid" | "provincesRequired" | "sortInvalid";
export type ZoneErrors = Partial<Record<"zone_name" | "fee" | "provinces" | "sort_order", ZoneErrorKey>>;

/** ตรงกับ backend normalizeProvince */
export const normalizeProvince = (p: string) => p.trim().replace(/^จังหวัด\s*/, "").replace(/^จ\.\s*/, "");

export function validateZone(f: DeliveryZoneInput): ZoneErrors {
  const e: ZoneErrors = {};
  const name = f.zone_name.trim();
  if (!name) e.zone_name = "nameRequired";
  else if (name.length > 200) e.zone_name = "nameTooLong";
  if (!Number.isFinite(f.fee) || f.fee < 0 || Math.round(f.fee * 100) !== f.fee * 100) e.fee = "feeInvalid";
  // backend รับโซนไม่มีจังหวัดได้ แต่โซนแบบนั้นไม่มีวันถูกใช้ — กันไว้ที่หน้าเว็บ
  if (!f.is_catch_all && f.provinces.length === 0) e.provinces = "provincesRequired";
  if (!Number.isInteger(f.sort_order)) e.sort_order = "sortInvalid";
  return e;
}

/** ตัดช่องว่าง/คำนำหน้า · ตัดชื่อซ้ำ · catch-all ไม่เก็บจังหวัด */
export function cleanZoneInput(f: DeliveryZoneInput): DeliveryZoneInput {
  const provinces = f.is_catch_all ? [] : [...new Set(f.provinces.map(normalizeProvince).filter(Boolean))];
  return { ...f, zone_name: f.zone_name.trim(), provinces };
}

export const toZoneForm = (z: DeliveryZone): DeliveryZoneInput => ({
  zone_name: z.zone_name,
  provinces: z.provinces,
  is_catch_all: z.is_catch_all,
  fee: z.fee,
  sort_order: z.sort_order,
  is_active: z.is_active,
});

const byOrder = (a: DeliveryZone, b: DeliveryZone) => a.sort_order - b.sort_order;

/** โซนที่ backend ใช้จริง (เปิดใช้ + ไม่ถูกลบ) เรียงตามลำดับ */
export const activeZones = (zones: DeliveryZone[]) => zones.filter((z) => z.is_active && !z.deleted_at).sort(byOrder);

/** โซนที่จะใช้กับจังหวัดนี้ · null = ใช้ค่าตั้งต้นของระบบ (env) */
export function resolveZone(province: string, zones: DeliveryZone[]): DeliveryZone | null {
  const p = normalizeProvince(province);
  const active = activeZones(zones);
  return active.find((z) => !z.is_catch_all && z.provinces.includes(p)) ?? active.find((z) => z.is_catch_all) ?? null;
}

/** จังหวัดที่อยู่หลายโซนที่เปิดใช้ → ใช้โซนแรกตามลำดับ (ที่เหลือไม่มีผลกับจังหวัดนั้น) */
export function duplicateProvinces(zones: DeliveryZone[]): { province: string; winner: string; others: string[] }[] {
  const seen = new Map<string, DeliveryZone[]>();
  for (const z of activeZones(zones)) {
    if (z.is_catch_all) continue;
    for (const p of z.provinces) seen.set(p, [...(seen.get(p) ?? []), z]);
  }
  return [...seen.entries()]
    .filter(([, zs]) => zs.length > 1)
    .map(([province, zs]) => ({ province, winner: zs[0].zone_name, others: zs.slice(1).map((z) => z.zone_name) }));
}
