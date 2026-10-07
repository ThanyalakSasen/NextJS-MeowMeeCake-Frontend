// ─────────────────────────────────────────────────────────────
// src/services/pickupLocations.ts — จุดรับสินค้า (หน้าร้านประจำสัปดาห์) · หน้าร้าน (สาธารณะ)
// GET /catalog/pickup-locations — backend คิดวันที่เลือกรับได้ให้แล้ว (order_pickup_dates ภายใน 14 วัน · เวลาไทย
// · ตัดวันนี้ถ้าเลยเวลาปิด) → ส่ง pickup_location_id + pickup_date ตอนสร้างออเดอร์ · server ตรวจซ้ำเสมอ
// ─────────────────────────────────────────────────────────────
import { http } from "@/lib/http";

export interface PickupLocation {
  _id: string;
  name: string;
  /** ที่อยู่ของจุดรับ */
  location: string;
  days: string[];
  open_time: string;
  close_time: string;
  map_url: string;
  /** "ทุกวัน · 09:00 - 18:00 น." */
  schedule: string;
  /** วันที่รับได้ของออเดอร์ปกติ YYYY-MM-DD (ว่าง = ช่วงนี้ไม่เปิด) */
  order_pickup_dates: string[];
}

export const pickupLocationsService = {
  list: async (): Promise<PickupLocation[]> => (await http.getList<PickupLocation>("/catalog/pickup-locations")).data,
};
