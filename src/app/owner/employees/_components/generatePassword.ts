// สุ่มรหัสผ่านให้พนักงานใหม่ (ปุ่ม "สุ่มรหัสผ่าน" ในหน้าเพิ่มพนักงาน — ยกจากต้นแบบ addEmployee)
// ตัดตัวที่สับสนง่ายออก (0/O, 1/l/I) เพราะเจ้าของร้านต้องอ่านไปบอกพนักงาน · ใช้ crypto.getRandomValues (ไม่ใช่ Math.random)
// rejection sampling — ทิ้งค่าที่เกินช่วงหารลงตัว ไม่ให้บางตัวอักษรออกบ่อยกว่าตัวอื่น
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";

// ตัวอักษรอังกฤษ + ตัวเลขเท่านั้น (ไม่มีอักขระพิเศษ)
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const LIMIT = 256 - (256 % CHARSET.length);

/** ความยาวคงที่ 8 ตัวพอดี (ไม่สั้น/ยาวกว่านี้) = ขั้นต่ำที่ backend รับ */
const LENGTH = MIN_PASSWORD_LENGTH;

export function generatePassword(): string {
  let out = "";
  const buf = new Uint8Array(LENGTH * 2);
  while (out.length < LENGTH) {
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b < LIMIT) out += CHARSET[b % CHARSET.length];
      if (out.length === LENGTH) break;
    }
  }
  return out;
}
