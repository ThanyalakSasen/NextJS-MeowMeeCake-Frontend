// สุ่มรหัสผ่านให้พนักงานใหม่ (ปุ่ม "สุ่มรหัสผ่าน" ในหน้าเพิ่มพนักงาน — ยกจากต้นแบบ addEmployee)
// ตัดตัวที่สับสนง่ายออก (0/O, 1/l/I) เพราะเจ้าของร้านต้องอ่านไปบอกพนักงาน · ใช้ crypto.getRandomValues (ไม่ใช่ Math.random)
// rejection sampling — ทิ้งค่าที่เกินช่วงหารลงตัว ไม่ให้บางตัวอักษรออกบ่อยกว่าตัวอื่น
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
const LIMIT = 256 - (256 % CHARSET.length);

export function generatePassword(length = 12): string {
  let out = "";
  const buf = new Uint8Array(length * 2);
  while (out.length < length) {
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b < LIMIT) out += CHARSET[b % CHARSET.length];
      if (out.length === length) break;
    }
  }
  return out;
}
