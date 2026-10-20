"use server";
// ล้างแคชแบนเนอร์หน้าร้านฝั่ง server ทันทีหลังหลังร้านบันทึก (ปกติแคช 60 วิ — src/lib/http.ts)
// เรียกจาก useStoreDesignViewModel หลังเพิ่ม/แก้/ลบ/เปิดปิด/จัดลำดับแบนเนอร์สำเร็จ
// server action เป็น endpoint สาธารณะ → ให้เฉพาะพนักงานที่ login อยู่ล้างได้ (กันคนนอกยิงล้างแคชรัว ๆ)
import { updateTag } from "next/cache";
import { currentUserOnServer } from "@/lib/serverAuth";
import { CATALOG_BANNERS_TAG } from "@/services/catalog";

export async function refreshStorefrontBanners(): Promise<void> {
  const user = await currentUserOnServer();
  if (!user || user.roleType === "customer") return;
  updateTag(CATALOG_BANNERS_TAG);
}
