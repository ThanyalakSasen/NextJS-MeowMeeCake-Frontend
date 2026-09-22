// ─────────────────────────────────────────────────────────────
// src/lib/uploads.ts
// backend คืน URL ของไฟล์ที่อัปโหลดจริง (product_img ฯลฯ — ดู src/lib/upload.ts ฝั่ง backend,
// localDiskDriver) เป็น relative path เช่น "/uploads/products/xxx.jpg" เสิร์ฟจาก backend origin เอง
// ไม่ใช่ frontend — คนละ origin กันเสมอ (frontend :3001, backend :3000 แม้ตอน dev, ยิ่งจำเป็นตอน
// deploy จริงที่เป็นคนละ subdomain กันตามที่ตัดสินใจไว้แล้ว — topology A)
//
// เรนเดอร์ path ดิบตรง ๆ เป็น <img src> จะ resolve กับ origin ของ "หน้าเว็บ" (frontend) ผิดที่ ได้ 404
// เสมอ — พบจริงตอนทดสอบหน้า products/[id]/edit (docs/BACKLOG.md) ยังไม่เคยมีสินค้าไหนในระบบใช้
// path รูปแบบปัจจุบันเลยสักตัว ก่อนหน้านี้เลยไม่มีใครเจอบั๊กนี้มาก่อน
// ─────────────────────────────────────────────────────────────

// NEXT_PUBLIC_API_BASE_URL ต้องมี /api ต่อท้ายเสมอ (ธรรมเนียมของโปรเจกต์ — ดู .env.example) ตัดออกให้
// เหลือแค่ origin เช่น "http://localhost:3000/api" -> "http://localhost:3000"
const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/api\/?$/, "");

/**
 * แปลง URL ของไฟล์อัปโหลดจาก backend ให้เป็น absolute URL เสมอ — ปล่อยผ่านตรง ๆ ถ้า absolute อยู่แล้ว
 * (http(s)://...) หรือเป็น data: URI (base64 ที่ยังฝังตรงในข้อมูลบางแถว/บางฟอร์มที่ยังไม่ผ่านการอัปโหลด
 * จริง — เช่น UploadImageBox ของแบนเนอร์/ใบเสร็จ) หรือไม่มีค่าเลย
 */
export function resolveUploadUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:")) return url;
  return `${BACKEND_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}
