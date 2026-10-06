import { CUSTOMER_HOME_PATH, HOME_PATH, PROFILE_PATH } from "@/constants/auth";
import type { RoleType } from "@/types/auth";

const isPath = (next: string, base: string) => next === base || next.startsWith(`${base}/`) || next.startsWith(`${base}?`);

/**
 * ปลายทางหลัง login ตาม role — รับ ?next= เฉพาะ path ภายในแอป (กัน open redirect)
 *  - ลูกค้า: หน้าร้าน (/customer/*) หรือ /profile · อย่างอื่น (รวม /owner) → หน้าแรกของหน้าร้าน
 *  - เจ้าของร้าน/พนักงาน: /owner/* · /profile · /customer/* (ดูหน้าร้านได้) · ไม่มี next → แดชบอร์ด
 * ใช้ทั้งล็อกอินด้วยรหัสผ่าน/Google (LoginForm) และกลับจาก LINE (/login/line)
 */
export function nextPathFor(roleType: RoleType | null, next: string | null): string {
  if (roleType === "customer") {
    return next && (isPath(next, CUSTOMER_HOME_PATH) || isPath(next, PROFILE_PATH)) ? next : CUSTOMER_HOME_PATH;
  }
  return next && (isPath(next, "/owner") || isPath(next, PROFILE_PATH) || isPath(next, CUSTOMER_HOME_PATH)) ? next : HOME_PATH;
}
